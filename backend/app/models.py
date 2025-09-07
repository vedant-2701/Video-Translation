from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.sql import func
import enum
from .database import Base

class JobStatus(str, enum.Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETE = "complete"
    FAILED = "failed"

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, index=True)
    status = Column(Enum(JobStatus), default=JobStatus.QUEUED)
    
    # Paths for files stored on the local disk
    original_video_path = Column(String)
    final_video_path = Column(String, nullable=True)
    subtitle_path = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
