import time
import subprocess
from pathlib import Path
from celery import Celery
from .config import settings
from .database import SessionLocal
from . import models

# Initialize Celery
celery_app = Celery(
    __name__,
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Kolkata', # Set to your timezone
    enable_utc=True,
)

@celery_app.task(name="translate_video_task")
def translate_video_task(job_id: str):
    """
    The main background task to process a video.
    """
    db = SessionLocal()
    try:
        # Get the job from the database
        job = db.query(models.Job).filter(models.Job.id == job_id).first()
        if not job:
            # Handle case where job is not found
            print(f"Job with id {job_id} not found.")
            return

        # 1. Update status to 'processing'
        job.status = "processing"
        db.commit()
        video_path = settings.ROOT_DIR / job.original_video_path
        print(video_path)
        print(f"Processing job {job_id} for video: {video_path}")

        # --- FFMPEG AUDIO EXTRACTION ---
        input_video_path = Path(video_path)
        print(str(input_video_path))
        
        # Define where the extracted audio will be saved
        # We save it in a temp folder to keep things clean
        temp_audio_path = Path(settings.ROOT_DIR) / Path(settings.STORAGE_PATH) / "temp" / f"{input_video_path.stem}.wav"

        print(f"Extracting audio to: {temp_audio_path}")

        # Construct the FFmpeg command
        # -i: input file
        # -vn: no video (we only want the audio)
        # -acodec pcm_s16le: standard WAV audio codec
        # -ar 16000: sample rate of 16kHz (ideal for Whisper)
        # -ac 1: mono audio (single channel)
        ffmpeg_command = [
            # "ffmpeg",
            r"D:\ffmpeg-n8.0-latest-win64-gpl-8.0\bin\ffmpeg.exe",
            "-i", str(input_video_path),
            "-vn",
            "-acodec", "pcm_s16le",
            "-ar", "16000",
            "-ac", "1",
            str(temp_audio_path)
        ]

        # Execute the command
        # check=True will raise an exception if FFmpeg fails (e.g., video has no audio)
        subprocess.run(ffmpeg_command, check=True, capture_output=True, text=True)

        print(f"Audio extraction successful for job {job_id}")
        
        # --- MOCK AI PIPELINE (for now) ---
        print("Starting mock AI processing...")
        time.sleep(5) # Simulate ASR, NMT, TTS
        print("Mock AI processing finished.")
        # --- END MOCK ---

        # 2. Update status to 'complete' on success
        job.status = "complete"
        # In the future, you will save the final URLs here
        # job.download_url = "path/to/final/video.mp4"
        # job.subtitle_url = "path/to/final/subs.vtt"
        db.commit()
        print(f"Job {job_id} completed successfully.")

    except subprocess.CalledProcessError as e:
        # This block will run if FFmpeg fails
        job.status = "failed"
        job.error_message = f"Audio extraction failed: {e.stderr.decode()}"
        db.commit()
        print(f"Job {job_id} failed during audio extraction. Error: {e.stderr.decode()}")
    except Exception as e:
        # This is a general catch-all for any other errors
        job.status = "failed"
        job.error_message = str(e)
        db.commit()
        print(f"An unexpected error occurred for job {job_id}: {e}")
    finally:
        db.close()

