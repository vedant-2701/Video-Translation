import time
import random
from pathlib import Path
from celery import Celery
from sqlalchemy.orm import Session
from .config import settings
from .database import SessionLocal
from . import models

# Initialize Celery
celery_app = Celery(
    "tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_track_started=True,
)

@celery_app.task(name="translate_video_task")
def translate_video_task(job_id: str):
    """
    This is the main background task that simulates the AI pipeline.
    """
    db: Session = SessionLocal()
    try:
        # 1. Update job status to 'processing'
        job = db.query(models.Job).filter(models.Job.id == job_id).first()
        if not job:
            # Handle case where job is not found
            return {"error": "Job not found"}
        
        job.status = models.JobStatus.PROCESSING
        db.commit()
        
        print(f"Job {job_id}: Started processing.")

        # --- MOCKED AI PIPELINE ---
        # This is where your real AI code will go.
        # For now, we simulate a long-running process.
        
        print(f"Job {job_id}: (Mock) Extracting audio...")
        time.sleep(2) # Simulate FFmpeg
        
        print(f"Job {job_id}: (Mock) Running ASR...")
        time.sleep(5) # Simulate faster-whisper
        
        print(f"Job {job_id}: (Mock) Running NMT...")
        time.sleep(2) # Simulate Helsinki-NLP
        
        print(f"Job {job_id}: (Mock) Running TTS...")
        time.sleep(5) # Simulate Coqui TTS
        
        print(f"Job {job_id}: (Mock) Merging final video...")
        time.sleep(2) # Simulate FFmpeg merge

        # --- END MOCKED PIPELINE ---

        # 2. Create mock output files and update job status to 'complete'
        storage_path = Path(settings.STORAGE_PATH)
        output_path = storage_path / "output"
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Simulate creating final files
        final_video_filename = f"{job_id}_final.mp4"
        subtitle_filename = f"{job_id}_subs.vtt"

        (output_path / final_video_filename).touch()
        (output_path / subtitle_filename).touch()
        
        job.status = models.JobStatus.COMPLETE
        job.final_video_path = str(output_path / final_video_filename)
        job.subtitle_path = str(output_path / subtitle_filename)
        db.commit()
        
        print(f"Job {job_id}: Processing complete.")
        return {"status": "complete", "job_id": job_id}

    except Exception as e:
        # 3. If anything goes wrong, update status to 'failed'
        job.status = models.JobStatus.FAILED
        db.commit()
        print(f"Job {job_id}: Processing failed with error: {e}")
        return {"status": "failed", "error": str(e)}
    finally:
        db.close()
