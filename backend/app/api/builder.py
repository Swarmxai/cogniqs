from pydantic import BaseModel, Field

from fastapi import APIRouter

from app.core.deps import CurrentUser
from app.services.workflow_builder import build_workflow_from_text

router = APIRouter(prefix="/builder", tags=["builder"])


class BuildRequest(BaseModel):
    description: str = Field(min_length=3, max_length=2000)


@router.post("/generate")
async def generate_workflow(body: BuildRequest, user: CurrentUser) -> dict:
    result = await build_workflow_from_text(body.description)
    return {"workflow": result, "generated_by": user.email}
