from typing import Any


class DbResult:
    def __init__(self, status: bool, result: Any):
        self.status: bool = status
        self.result: Any = result
