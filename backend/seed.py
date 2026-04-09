"""Seed script for indexed materials."""
from app.db.base import SessionLocal
from app.services.material_seeder import seed_materials

db = SessionLocal()
seed_materials(db, count=1000)
db.close()
print("Seeded 1000 materials")
