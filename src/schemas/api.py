from dataclasses import dataclass


@dataclass
class APIResponse[Data]:
    status: bool
    message: str
    data: Data | None = None
