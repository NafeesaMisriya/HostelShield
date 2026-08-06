import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.exceptions import RequestValidationError

from .database import engine, Base
from .seed import seed_data
from .routers import (
    auth_router,
    student_router,
    visitor_router,
    security_router,
    admin_router,
    notification_router
)

# Initialize database schema
Base.metadata.create_all(bind=engine)
# Seed demo data
seed_data()

app = FastAPI(
    title="Smart Hostel Visitor Management System",
    description="Zero-bug hackathon backend API with FastAPI, SQLite, JWT auth, and overstay calculation",
    version="1.1.0"
)

# Custom Exception Handler for Pydantic Validation Errors (422)
# Ensures clean, human-readable string detail for phone, gov_id, and input field errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    messages = []
    for error in exc.errors():
        msg = error.get("msg", "")
        if msg.startswith("Value error, "):
            msg = msg.replace("Value error, ", "")
        messages.append(msg)
    clean_msg = " | ".join(messages) if messages else "Invalid input data provided."
    return JSONResponse(
        status_code=422,
        content={"detail": clean_msg}
    )

# CORS configuration for browser compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach Routers
app.include_router(auth_router.router)
app.include_router(student_router.router)
app.include_router(visitor_router.router)
app.include_router(security_router.router)
app.include_router(admin_router.router)
app.include_router(notification_router.router)

# Static files for web app UI
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def read_root():
    index_file = os.path.join(static_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {
        "status": "online",
        "system": "Smart Hostel Visitor Management System API",
        "docs_url": "/docs"
    }
