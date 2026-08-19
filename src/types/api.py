from pydantic import BaseModel


class APIResponseSuccess(BaseModel):
    status: bool = True
    message: str | None = None
    data: dict | None = None

    def __init__(self, message: str | None = None, data: dict | None = None):
        self.message = message
        self.data = data
