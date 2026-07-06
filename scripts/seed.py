import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.db.session import Base, SessionLocal, engine
from app.models import ReviewLevel, SystemSetting, User


SEED_USERS = [
    {
        "display_name": "Budi Santoso",
        "email": "budi.santoso@example.com",
        "position": "Account Manager",
        "unit": "Regional III RLEGS",
        "department": "Account Management",
        "region": "Bali Nusra",
    },
    {
        "display_name": "Rias Sukmawati",
        "email": "rias.sukmawati@example.com",
        "position": "Legal Reviewer",
        "unit": "RLEGS",
        "department": "Legal",
        "region": "Bali Nusra",
    },
    {
        "display_name": "Ayu Kirana Dewi",
        "email": "ayu.kirana@example.com",
        "position": "Contract Drafter",
        "unit": "ES Bali",
        "department": "Enterprise Service",
        "region": "Bali Nusra",
    },
    {
        "display_name": "Putu Wahyu Saputra",
        "email": "putu.wahyu@example.com",
        "position": "Reviewer",
        "unit": "RLEGS",
        "department": "Legal",
        "region": "Bali Nusra",
    },
    {
        "display_name": "Jordy Gerry Rezandy",
        "email": "jordy.gerry@example.com",
        "position": "Account / Project PIC",
        "unit": "ES Suramadu",
        "department": "Enterprise Service",
        "region": "Jawa Timur",
    },
    {
        "display_name": "Evi Kurnia Febriani",
        "email": "evi.kurnia@example.com",
        "position": "Reviewer",
        "unit": "ES Suramadu",
        "department": "Enterprise Service",
        "region": "Jawa Timur",
    },
]

SEED_LEVELS = [
    {
        "code": "F0",
        "name": "Lead / Registrasi Proyek",
        "sequence": 0,
        "manager_email": "budi.santoso@example.com",
        "sla_hours": 48,
    },
    {
        "code": "F1",
        "name": "Verifikasi Awal",
        "sequence": 1,
        "manager_email": "budi.santoso@example.com",
        "sla_hours": 48,
    },
    {
        "code": "F2",
        "name": "Self Assessment",
        "sequence": 2,
        "manager_email": "putu.wahyu@example.com",
        "sla_hours": 48,
    },
    {
        "code": "F3",
        "name": "Penilaian Kelayakan Teknis & Finansial oleh SDA (GO/NO GO)",
        "sequence": 3,
        "manager_email": "rias.sukmawati@example.com",
        "sla_hours": 48,
    },
    {
        "code": "F4",
        "name": "Legal Review",
        "sequence": 4,
        "manager_email": "rias.sukmawati@example.com",
        "sla_hours": 48,
    },
    {
        "code": "F5",
        "name": "Final Approval / Kontrak Layanan",
        "sequence": 5,
        "manager_email": "evi.kurnia@example.com",
        "sla_hours": 48,
    },
]


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for item in SEED_USERS:
            existing = db.query(User).filter(User.email == item["email"]).first()
            if not existing:
                db.add(User(**item))
        db.flush()

        for item in SEED_LEVELS:
            existing = db.query(ReviewLevel).filter(ReviewLevel.code == item["code"]).first()
            manager = db.query(User).filter(User.email == item["manager_email"]).first()
            if not existing:
                db.add(
                    ReviewLevel(
                        code=item["code"],
                        name=item["name"],
                        sequence=item["sequence"],
                        default_manager_id=manager.id if manager else None,
                        sla_hours=item["sla_hours"],
                    )
                )

        for key, value, description in [
            ("default_sla_hours", "48", "Tenggat global dokumen idle di level manager."),
            ("warning_sla_hours", "24", "Ambang warning SLA sebelum overdue."),
        ]:
            existing = db.get(SystemSetting, key)
            if not existing:
                db.add(SystemSetting(key=key, value=value, description=description))
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()
