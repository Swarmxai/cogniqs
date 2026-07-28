"""Vision OCR node — Extract printed and handwritten text using Azure Document Intelligence.

Uses the Azure Document Intelligence (formerly Form Recognizer) prebuilt-read model.
Supports:
  - Printed text extraction
  - Handwritten text extraction
  - Multi-language support
  - PDF and image inputs

Accepts an image via:
  - Upstream node output (image_base64 from an image-producing node)
  - Direct base64 or URL in parameters
  - Dynamic input from trigger_data
"""

from __future__ import annotations

import asyncio
import base64
import io
import json
import logging
from typing import Any

import httpx

from app.engine.expression_evaluator import evaluate_expression
from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node

logger = logging.getLogger(__name__)


@register_node
class VisionOCRNode(BaseNode):
    """Extract printed and handwritten text using Azure Document Intelligence Read API."""

    description = NodeDescription(
        display_name="Azure Vision OCR",
        name="vision_ocr",
        category="AI",
        icon="eye",
        description="Extract printed and handwritten text from images using Azure Document Intelligence (Read model)",
        color="#0284c7",
        inputs=["main"],
        outputs=["main"],
        properties=[
            NodeProperty(
                "Image Source",
                "image_source",
                "options",
                default="auto",
                options=[
                    NodePropertyOption("Auto (from upstream)", "auto"),
                    NodePropertyOption("Base64 Field", "base64"),
                    NodePropertyOption("Image URL", "url"),
                ],
                description="Where to get the image for OCR",
            ),
            NodeProperty(
                "Image Field",
                "image_field",
                "string",
                default="image_base64",
                placeholder="image_base64",
                description="Field name or expression containing the base64 image data",
                display_options={"show": {"image_source": ["base64"]}},
            ),
            NodeProperty(
                "Image URL",
                "image_url",
                "string",
                default="",
                placeholder="https://example.com/image.png",
                description="Direct URL to the image",
                display_options={"show": {"image_source": ["url"]}},
            ),
            NodeProperty(
                "Language",
                "language",
                "string",
                default="",
                placeholder="en (leave empty for auto-detect)",
                description="BCP-47 language hint (e.g., en, hi, de). Leave empty to auto-detect.",
            ),
            NodeProperty(
                "Output Format",
                "output_format",
                "options",
                default="structured",
                options=[
                    NodePropertyOption("Structured (lines + words + bounding boxes)", "structured"),
                    NodePropertyOption("Plain Text (concatenated lines)", "plain"),
                ],
                description="How to format the OCR output",
            ),
        ],
        credentials=[
            {
                "name": "azureVisionOcr",
                "displayName": "Azure Document Intelligence (OCR)",
                "required": True,
                "types": ["azure_vision_ocr"],
            },
        ],
    )

    async def execute(
        self, node_id: str, parameters: dict[str, Any], context: dict[str, Any],
    ) -> dict[str, Any]:
        logger.info("[Vision OCR %s] execute called", node_id)

        # ── Resolve credentials ───────────────────────────────────────
        cred = context.get("credentials", {})
        api_key = cred.get("apiKey") or cred.get("api_key") or ""
        endpoint = (cred.get("endpoint") or "").rstrip("/")
        api_version = cred.get("apiVersion") or cred.get("api_version") or "2024-11-30"

        if not api_key or not endpoint:
            return {
                "status": "error",
                "error": (
                    "Azure Document Intelligence credentials are required. "
                    "Attach an 'Azure Document Intelligence (OCR)' credential with subscription key and endpoint."
                ),
                "text": "",
                "lines": [],
            }

        # ── Resolve image ─────────────────────────────────────────────
        image_bytes, image_url = await self._resolve_image(parameters, context)

        if not image_bytes and not image_url:
            return {
                "status": "error",
                "error": "No image found. Connect an image-producing node upstream or provide an image URL/base64.",
                "text": "",
                "lines": [],
            }

        # ── Call Azure Document Intelligence Read API ─────────────────
        language = (parameters.get("language") or "").strip()

        url = f"{endpoint}/documentintelligence/documentModels/prebuilt-read:analyze?api-version={api_version}"
        if language:
            url += f"&locale={language}"

        logger.info("[Vision OCR %s] Calling: %s", node_id, url.split("?")[0])

        headers: dict[str, str] = {"Ocp-Apim-Subscription-Key": api_key}

        try:
            async with httpx.AsyncClient(timeout=120) as client:
                # Submit the analyze request (returns 202 with Operation-Location)
                if image_bytes:
                    headers["Content-Type"] = "application/octet-stream"
                    resp = await client.post(url, content=image_bytes, headers=headers)
                else:
                    headers["Content-Type"] = "application/json"
                    resp = await client.post(url, json={"urlSource": image_url}, headers=headers)

                if resp.status_code not in (200, 202):
                    error_detail = ""
                    try:
                        err_body = resp.json()
                        error_detail = err_body.get("error", {}).get("message", "") or json.dumps(err_body)
                    except Exception:
                        error_detail = resp.text[:500]
                    logger.error(
                        "[Vision OCR %s] API error %s: %s", node_id, resp.status_code, error_detail
                    )
                    return {
                        "status": "error",
                        "error": f"Document Intelligence API error ({resp.status_code}): {error_detail}",
                        "text": "",
                        "lines": [],
                    }

                operation_url = resp.headers.get("Operation-Location") or resp.headers.get("operation-location")

                if not operation_url:
                    # Some versions return result directly for 200
                    if resp.status_code == 200:
                        result = resp.json()
                    else:
                        return {
                            "status": "error",
                            "error": "No Operation-Location header in response",
                            "text": "",
                            "lines": [],
                        }
                else:
                    poll_headers = {"Ocp-Apim-Subscription-Key": api_key}
                    result = await self._poll_result(client, operation_url, poll_headers, node_id)

        except httpx.HTTPStatusError as exc:
            error_detail = ""
            try:
                err_body = exc.response.json()
                error_detail = err_body.get("error", {}).get("message", "") or json.dumps(err_body)
            except Exception:
                error_detail = exc.response.text[:500]
            logger.error("[Vision OCR %s] API error %s: %s", node_id, exc.response.status_code, error_detail)
            return {
                "status": "error",
                "error": f"Document Intelligence API error ({exc.response.status_code}): {error_detail}",
                "text": "",
                "lines": [],
            }
        except Exception as exc:
            logger.error("[Vision OCR %s] Request failed: %s", node_id, exc)
            return {
                "status": "error",
                "error": f"Vision OCR request failed: {exc}",
                "text": "",
                "lines": [],
            }

        if isinstance(result, dict) and result.get("status") == "error":
            return result

        # ── Parse Document Intelligence Read response ─────────────────
        analyze_result = result.get("analyzeResult", {})
        content = analyze_result.get("content", "")
        pages = analyze_result.get("pages", [])

        all_lines: list[dict[str, Any]] = []
        all_text_parts: list[str] = []

        for page in pages:
            for line in page.get("lines", []):
                line_text = line.get("content", "")
                all_text_parts.append(line_text)
                all_lines.append({
                    "text": line_text,
                    "bounding_polygon": line.get("polygon", []),
                    "words": [],
                    "confidence": line.get("confidence", 0) if "confidence" in line else 0.0,
                })

        # Use the full content from the API (preserves paragraph structure)
        full_text = content or "\n".join(all_text_parts)
        avg_confidence = (
            sum(ln["confidence"] for ln in all_lines) / max(len(all_lines), 1)
        ) if all_lines else 0

        # ── Build output ──────────────────────────────────────────────
        output_format = parameters.get("output_format", "structured")

        json_in = context.get("json") or {}
        output: dict[str, Any] = {}
        if isinstance(json_in, dict):
            output.update(json_in)

        output["text"] = full_text
        output["line_count"] = len(all_lines)
        output["average_confidence"] = round(avg_confidence, 4)
        output["status"] = "success"

        if output_format == "structured":
            output["lines"] = all_lines
            output["pages"] = pages

            # Draw bounding boxes so the NDV can render a rich preview
            annotated_b64 = self._draw_bboxes_on_image(
                image_bytes, image_url, all_lines, pages, node_id,
            )
            if annotated_b64:
                output["annotated_image_base64"] = annotated_b64
                output["_display"] = {"type": "ocr_bbox_viewer"}

            if image_bytes:
                output["source_image_base64"] = base64.b64encode(image_bytes).decode("ascii")
        else:
            output["lines"] = all_text_parts

        output["_ocr_metadata"] = {
            "model_id": analyze_result.get("modelId", "prebuilt-read"),
            "api_version": api_version,
            "language_detected": analyze_result.get("languages", []),
        }

        return output

    async def _poll_result(
        self, client: httpx.AsyncClient, operation_url: str, headers: dict[str, str], node_id: str,
    ) -> dict[str, Any]:
        """Poll the Document Intelligence operation until completion."""
        max_polls = 60  # ~60 seconds max
        poll_interval = 1.0

        for i in range(max_polls):
            await asyncio.sleep(poll_interval)
            resp = await client.get(operation_url, headers=headers)
            resp.raise_for_status()
            result = resp.json()

            status = result.get("status", "")
            if status == "succeeded":
                logger.info("[Vision OCR %s] Analysis completed after %d polls", node_id, i + 1)
                return result
            if status == "failed":
                msg = result.get("error", {}).get("message", "Analysis failed")
                logger.error("[Vision OCR %s] Analysis failed: %s", node_id, msg)
                return {
                    "status": "error",
                    "error": f"Document Intelligence analysis failed: {msg}",
                    "text": "",
                    "lines": [],
                }

        logger.error("[Vision OCR %s] Analysis timed out after %d polls", node_id, max_polls)
        return {
            "status": "error",
            "error": "Document Intelligence analysis timed out",
            "text": "",
            "lines": [],
        }

    def _draw_bboxes_on_image(
        self,
        image_bytes: bytes | None,
        image_url: str | None,
        lines: list[dict[str, Any]],
        pages: list[dict[str, Any]],
        node_id: str,
    ) -> str | None:
        """Draw bounding boxes on the source image and return annotated image as base64 PNG."""
        try:
            from PIL import Image, ImageDraw

            if image_bytes:
                img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
            elif image_url:
                import urllib.request
                with urllib.request.urlopen(image_url, timeout=30) as resp:
                    img = Image.open(io.BytesIO(resp.read())).convert("RGBA")
            else:
                return None

            img_width, img_height = img.size

            overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
            draw = ImageDraw.Draw(overlay)

            # Azure DI reports page dimensions in its own units — scale to pixels
            page_width = pages[0].get("width", img_width) if pages else img_width
            page_height = pages[0].get("height", img_height) if pages else img_height
            scale_x = img_width / page_width if page_width else 1
            scale_y = img_height / page_height if page_height else 1

            colors = [
                (59, 130, 246, 50),   # blue fill
                (16, 185, 129, 50),   # green fill
                (245, 158, 11, 50),   # amber fill
                (139, 92, 246, 50),   # purple fill
                (239, 68, 68, 50),    # red fill
            ]
            border_colors = [
                (59, 130, 246, 200),
                (16, 185, 129, 200),
                (245, 158, 11, 200),
                (139, 92, 246, 200),
                (239, 68, 68, 200),
            ]

            for idx, line in enumerate(lines):
                polygon = line.get("bounding_polygon", [])
                if not polygon or len(polygon) < 4:
                    continue

                # Azure DI returns polygon as flat list [x1,y1,x2,y2,...] or list of points
                if isinstance(polygon[0], (int, float)):
                    points = [
                        (polygon[i] * scale_x, polygon[i + 1] * scale_y)
                        for i in range(0, len(polygon) - 1, 2)
                    ]
                else:
                    points = [
                        (p.get("x", 0) * scale_x, p.get("y", 0) * scale_y)
                        for p in polygon
                    ]

                color_idx = idx % len(colors)
                if len(points) >= 3:
                    draw.polygon(points, fill=colors[color_idx], outline=border_colors[color_idx])
                else:
                    xs = [p[0] for p in points]
                    ys = [p[1] for p in points]
                    draw.rectangle(
                        [min(xs), min(ys), max(xs), max(ys)],
                        fill=colors[color_idx], outline=border_colors[color_idx],
                    )

            result_img = Image.alpha_composite(img, overlay).convert("RGB")

            buf = io.BytesIO()
            result_img.save(buf, format="PNG", optimize=True)
            b64 = base64.b64encode(buf.getvalue()).decode("ascii")
            logger.info("[Vision OCR %s] Generated annotated image (%d lines)", node_id, len(lines))
            return b64

        except Exception as exc:
            logger.warning("[Vision OCR %s] Failed to draw bboxes: %s", node_id, exc)
            return None

    async def _resolve_image(
        self, parameters: dict[str, Any], context: dict[str, Any],
    ) -> tuple[bytes | None, str | None]:
        """Resolve image to raw bytes or a URL.

        Returns:
            (image_bytes, image_url) — one will be set, the other None.
        """
        image_source = parameters.get("image_source", "auto")
        json_in = context.get("json") or {}

        if image_source == "auto":
            if isinstance(json_in, dict):
                b64 = (
                    json_in.get("image_base64")
                    or json_in.get("content_base64")
                    or json_in.get("pdf_base64")
                )
                if b64:
                    return self._decode_b64(b64), None

                images = json_in.get("images")
                if isinstance(images, list) and images:
                    first = images[0]
                    if isinstance(first, dict) and first.get("content_base64"):
                        return self._decode_b64(first["content_base64"]), None

                url = json_in.get("image_url") or json_in.get("url")
                if isinstance(url, str) and url.startswith(("http://", "https://")):
                    return None, url

            trigger = context.get("trigger_data") or {}
            if isinstance(trigger, dict):
                b64 = trigger.get("image_base64") or trigger.get("pdf_base64")
                if b64:
                    return self._decode_b64(b64), None

        elif image_source == "base64":
            field = (parameters.get("image_field") or "image_base64").strip()
            resolved = evaluate_expression(field, context)
            if resolved and resolved != field:
                return self._decode_b64(str(resolved)), None
            if isinstance(json_in, dict) and field in json_in:
                val = json_in[field]
                if val:
                    return self._decode_b64(str(val)), None

        elif image_source == "url":
            url = (parameters.get("image_url") or "").strip()
            if url and url.startswith(("http://", "https://")):
                return None, url

        return None, None

    def _decode_b64(self, b64: str) -> bytes | None:
        """Decode base64 string to raw bytes, stripping data URL prefix if present."""
        if not b64:
            return None
        if b64.startswith("data:"):
            _, _, b64 = b64.partition(",")
        try:
            return base64.b64decode(b64)
        except Exception:
            logger.warning("[Vision OCR] Failed to decode base64 data")
            return None
