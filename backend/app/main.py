import uuid
import shutil
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from . import models, schemas, database, celery_worker, config

# Create all database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="VaniSetu Backend")

# --- CORS Middleware ---
# This allows our Next.js frontend (running on a different port)
# to communicate with our backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # The origin of your Next.js app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Endpoints ---

@app.get("/")
def read_root():
    return {"message": "Welcome to VaniSetu API"}

@app.post("/api/jobs", response_model=schemas.JobCreateResponse, status_code=202)
async def create_translation_job(
    video: UploadFile = File(...), 
    db: Session = Depends(database.get_db)
):
    """
    This endpoint handles the recorded video upload.
    1. Generates a unique job ID.
    2. Saves the uploaded video file to a local directory.
    3. Creates a new job record in the database.
    4. Triggers the Celery background task to process the video.
    """
    job_id = str(uuid.uuid4())
    
    # Ensure storage directories exist
    storage_path = Path(config.settings.STORAGE_PATH)
    upload_path = storage_path / "uploads"
    upload_path.mkdir(parents=True, exist_ok=True)
    
    file_path = upload_path / f"{job_id}_{video.filename}"

    # Save the uploaded file
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(video.file, buffer)

    # Create a job record in the database
    db_job = models.Job(
        id=job_id,
        status=models.JobStatus.QUEUED,
        original_video_path=str(file_path)
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)

    # Launch the background task
    celery_worker.translate_video_task.delay(job_id)

    return {"job_id": job_id, "status": db_job.status}


@app.get("/api/jobs/{job_id}", response_model=schemas.JobStatusResponse)
def get_job_status(job_id: str, db: Session = Depends(database.get_db)):
    """
    This endpoint allows the frontend to poll for the status of a job.
    """
    db_job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if db_job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    response_data = {
        "job_id": db_job.id,
        "status": db_job.status,
    }

    # If the job is complete, create downloadable URLs for the frontend
    if db_job.status == models.JobStatus.COMPLETE:
        base_url = "http://localhost:8000" # Replace with your actual domain in production
        response_data["final_video_url"] = f"{base_url}/api/downloads/videos/{db_job.id}"
        response_data["subtitle_url"] = f"{base_url}/api/downloads/subtitles/{db_job.id}"

    return response_data

# --- File Download Endpoints ---

@app.get("/api/downloads/videos/{job_id}")
async def download_video(job_id: str, db: Session = Depends(database.get_db)):
    db_job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not db_job or not db_job.final_video_path:
        raise HTTPException(status_code=404, detail="Video not found")
    return FileResponse(path=db_job.final_video_path, media_type='video/mp4', filename=f"{job_id}_translated.mp4")

@app.get("/api/downloads/subtitles/{job_id}")
async def download_subtitles(job_id: str, db: Session = Depends(database.get_db)):
    db_job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not db_job or not db_job.subtitle_path:
        raise HTTPException(status_code=404, detail="Subtitles not found")
    return FileResponse(path=db_job.subtitle_path, media_type='text/vtt', filename=f"{job_id}_subs.vtt")
