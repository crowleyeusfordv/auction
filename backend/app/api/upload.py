import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from supabase import create_client, Client
from typing import Optional
from uuid import uuid4
import mimetypes

upload_router = APIRouter()

@upload_router.post('/upload')
async def upload_file(file: UploadFile = File(...)):
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY')
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail='Supabase credentials not configured')
        
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        file_bytes = await file.read()
        
        if len(file_bytes) > 50 * 1024 * 1024:
            raise HTTPException(status_code=413, detail='File too large. Max 50MB.')
        
        # Generate unique filename
        ext = mimetypes.guess_extension(file.content_type or '') or ''
        if not ext and file.filename:
            ext = os.path.splitext(file.filename)[1]
            
        filename = f"{uuid4()}{ext}"
        
        # Upload to Supabase Storage
        res = supabase.storage.from_('auctions').upload(
            path=filename,
            file=file_bytes,
            file_options={'content-type': file.content_type}
        )
        
        # Get public url
        public_url = supabase.storage.from_('auctions').get_public_url(filename)
        
        return {"url": public_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
