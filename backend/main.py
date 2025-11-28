import os
import uuid
import json
import threading
import subprocess
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import Dict
import time

app = FastAPI()
UPLOAD_DIR = './storage/uploads'
RESULT_DIR = './storage/results'
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)

jobs: Dict[str, dict] = {}  # in-memory. {job_id: {'status': 'pending'|'processing'|'done'|'error', 'result': path}}

class UploadResponse(BaseModel):
    job_id: str

def ffmpeg_render(input_path, metadata, output_path):
    """
    Simple placeholder: you will replace this with actual ffmpeg overlay commands.
    For now we just copy/encode.
    """
    try:
        # Example: call ffmpeg to copy video (no changes) to simulate processing
        cmd = [
            'ffmpeg', '-y', '-i', input_path,
            '-c:v', 'libx264', '-preset', 'fast',
            '-vf', "scale=trunc(iw/2)*2:trunc(ih/2)*2", # ensure even dims
            output_path
        ]
        subprocess.run(cmd, check=True)
        return True, None
    except Exception as e:
        return False, str(e)

def process_job(job_id):
    jobs[job_id]['status'] = 'processing'
    try:
        inpath = jobs[job_id]['input']
        metadata = jobs[job_id]['metadata']
        outname = f"{job_id}.mp4"
        outpath = os.path.join(RESULT_DIR, outname)
        # call ffmpeg/rendering
        ok, err = ffmpeg_render(inpath, metadata, outpath)
        if ok:
            jobs[job_id]['status'] = 'done'
            jobs[job_id]['result'] = outpath
        else:
            jobs[job_id]['status'] = 'error'
            jobs[job_id]['error'] = err
    except Exception as e:
        jobs[job_id]['status'] = 'error'
        jobs[job_id]['error'] = str(e)

@app.post("/upload")
async def upload(file: UploadFile = File(...), metadata: str = Form(...)):
    job_id = str(uuid.uuid4())
    input_path = os.path.join(UPLOAD_DIR, f"{job_id}_{file.filename}")
    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)
    try:
        meta = json.loads(metadata)
    except:
        meta = metadata
    jobs[job_id] = {'status': 'pending', 'input': input_path, 'metadata': meta}
    # spawn background thread to process
    t = threading.Thread(target=process_job, args=(job_id,), daemon=True)
    t.start()
    return JSONResponse(content={"job_id": job_id})

@app.get("/status/{job_id}")
def status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        return JSONResponse(status_code=404, content={"error":"job not found"})
    return JSONResponse(content={"job_id": job_id, "status": job['status']})

@app.get("/result/{job_id}")
def result(job_id: str):
    job = jobs.get(job_id)
    if not job:
        return JSONResponse(status_code=404, content={"error":"job not found"})
    if job['status'] != 'done':
        return JSONResponse(status_code=400, content={"error":"not ready"})
    return FileResponse(job['result'], media_type='video/mp4', filename=os.path.basename(job['result']))
