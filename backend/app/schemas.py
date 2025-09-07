from pydantic import BaseModel
from typing import Optional
from .models import JobStatus

# Pydantic model for creating a job response (what we send back to the frontend)
class JobCreateResponse(BaseModel):
    job_id: str
    status: JobStatus

# Pydantic model for the job status response
class JobStatusResponse(BaseModel):
    job_id: str
    status: JobStatus
    final_video_url: Optional[str] = None
    subtitle_url: Optional[str] = None

    class Config:
        orm_mode = True
