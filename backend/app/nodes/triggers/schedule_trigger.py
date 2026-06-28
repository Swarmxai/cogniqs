from typing import Any

from app.engine.node_base import BaseNode, NodeDescription, NodeProperty, NodePropertyOption
from app.engine.node_registry import register_node


@register_node
class ScheduleTriggerNode(BaseNode):
    description = NodeDescription(
        display_name="Schedule",
        name="schedule_trigger",
        category="Triggers",
        icon="clock",
        color="#10b981",
        description="Run on a cron schedule",
        outputs=["main"],
        properties=[
            NodeProperty("Rule", "rule", "options", default="everyHour", options=[
                NodePropertyOption("Every minute", "everyMinute"),
                NodePropertyOption("Every 15 minutes", "every15Minutes"),
                NodePropertyOption("Every hour", "everyHour"),
                NodePropertyOption("Every day at midnight", "everyDay"),
                NodePropertyOption("Every week", "everyWeek"),
                NodePropertyOption("Custom cron", "custom"),
            ]),
            NodeProperty(
                "Cron Expression",
                "cronExpression",
                "string",
                default="0 * * * *",
                placeholder="0 9 * * 1-5",
                description="Used when Rule is Custom cron.",
                display_options={"show": {"rule": ["custom"]}},
            ),
            NodeProperty(
                "Timezone",
                "timezone",
                "string",
                default="UTC",
                placeholder="UTC, America/New_York, …",
            ),
        ],
    )

    async def execute(self, node_id: str, parameters: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
        return {
            "scheduled": True,
            "rule": parameters.get("rule", "everyHour"),
            "cronExpression": parameters.get("cronExpression"),
            "timezone": parameters.get("timezone", "UTC"),
        }
