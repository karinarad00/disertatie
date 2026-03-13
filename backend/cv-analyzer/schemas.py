from pydantic import BaseModel

class CVRequest(BaseModel):
    cvUrl: str
