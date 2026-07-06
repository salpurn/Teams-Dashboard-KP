"""Seed data — diselaraskan dengan USERS_ROLE & sample project di mockData.js (r-legs-tracking)."""

import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.core.funnel import FUNNEL_STEP_BY_CODE, primary_role_for_step
from app.db.session import Base, SessionLocal, engine
from app.models import AuditEvent, Project, ProjectStep, SystemSetting, User
from app.models.enums import DocumentStatus, FunnelStepCode, ProjectStatus, ReviewDecision, UserRole

SLA_DEFAULT_HOURS = 48
SLA_WARNING_HOURS = 24

# AM (Budi/Siti/Yuni), BUD (Ahmad/Dewi), SDA (Rian/Arief), LEGAL (Indra/Riana), MANAGER (Heru)
SEED_USERS = [
    {
        "display_name": "Budi Santoso",
        "email": "budi.santoso@telkom.co.id",
        "role": UserRole.AM,
        "position": "Account Manager",
        "unit": "Account Management B2B R-LEGS",
        "department": "Account Management",
        "region": "Regional IV",
    },
    {
        "display_name": "Siti Aminah",
        "email": "siti.aminah@telkom.co.id",
        "role": UserRole.AM,
        "position": "Account Manager",
        "unit": "Account Management B2B R-LEGS",
        "department": "Account Management",
        "region": "Regional IV",
    },
    {
        "display_name": "Yuni Kartika",
        "email": "yuni.kartika@telkom.co.id",
        "role": UserRole.AM,
        "position": "Account Manager",
        "unit": "Account Management B2B R-LEGS",
        "department": "Account Management",
        "region": "Regional IV",
    },
    {
        "display_name": "Ahmad Yani",
        "email": "ahmad.yani@telkom.co.id",
        "role": UserRole.BUD,
        "position": "Business Unit Delivery (BUD) Officer",
        "unit": "SDA & BUD Division Regional IV",
        "department": "Business Unit Delivery",
        "region": "Regional IV",
    },
    {
        "display_name": "Dewi Lestari",
        "email": "dewi.lestari@telkom.co.id",
        "role": UserRole.BUD,
        "position": "Business Unit Delivery (BUD) Officer",
        "unit": "SDA & BUD Division Regional IV",
        "department": "Business Unit Delivery",
        "region": "Regional IV",
    },
    {
        "display_name": "Rian Wijaya",
        "email": "rian.wijaya@telkom.co.id",
        "role": UserRole.SDA,
        "position": "Service Delivery Assurance (SDA) Officer",
        "unit": "SDA & BUD Division Regional IV",
        "department": "Service Delivery Assurance",
        "region": "Regional IV",
    },
    {
        "display_name": "Arief Rahman",
        "email": "arief.rahman@telkom.co.id",
        "role": UserRole.SDA,
        "position": "Service Delivery Assurance (SDA) Officer",
        "unit": "SDA & BUD Division Regional IV",
        "department": "Service Delivery Assurance",
        "region": "Regional IV",
    },
    {
        "display_name": "Indra Hermawan, S.H.",
        "email": "indra.hermawan@telkom.co.id",
        "role": UserRole.LEGAL,
        "position": "Legal Officer",
        "unit": "Legal & Compliance Regional IV",
        "department": "Legal",
        "region": "Regional IV",
    },
    {
        "display_name": "Riana Indah, S.H.",
        "email": "riana.indah@telkom.co.id",
        "role": UserRole.LEGAL,
        "position": "Legal Officer",
        "unit": "Legal & Compliance Regional IV",
        "department": "Legal",
        "region": "Regional IV",
    },
    {
        "display_name": "Heru Wibowo, M.B.A.",
        "email": "heru.wibowo@telkom.co.id",
        "role": UserRole.MANAGER,
        "position": "Regional Head of R-LEGS",
        "unit": "Executive Board Regional IV Telkom",
        "department": "Executive",
        "region": "Regional IV",
    },
]

# Tiap project: current_step menentukan current_phase (dari katalog funnel), status project
# (active/won/cancelled), tim (AM wajib, BUD/SDA/LEGAL opsional), dan riwayat step yang sudah
# lewat (approved_until, exclusive terhadap current_step) plus histori audit ringkas. Setara
# `documents[]`/`history[]` per project di mockData.js, tapi diringkas jadi representasi
# programatik supaya konsisten dengan FUNNEL_STEP_ORDER.
SEED_PROJECTS = [
    {
        "project_code": "PRJ-2026-001",
        "title": "Pengadaan Access Point & Wi-Fi Kampus Terpadu",
        "client_name": "Universitas Negeri Semarang (UNNES)",
        "contract_value": 1950000000,
        "am_email": "budi.santoso@telkom.co.id",
        "bud_email": "ahmad.yani@telkom.co.id",
        "sda_email": "rian.wijaya@telkom.co.id",
        "legal_email": "indra.hermawan@telkom.co.id",
        "current_step": FunnelStepCode.P2,
        "hours_ago": 3,
        "notes": "Baru masuk F2, custodian BUD sedang evaluasi calon mitra.",
    },
    {
        "project_code": "PRJ-2026-002",
        "title": "Migrasi Sistem Cloud & EHR Rumah Sakit",
        "client_name": "RSUD DR. Kariadi Semarang",
        "contract_value": 5200000000,
        "am_email": "siti.aminah@telkom.co.id",
        "bud_email": "dewi.lestari@telkom.co.id",
        "sda_email": "arief.rahman@telkom.co.id",
        "legal_email": "riana.indah@telkom.co.id",
        "current_step": FunnelStepCode.P6,
        "hours_ago": 30,
        "notes": "Klarifikasi & nego harga sedang berjalan, mendekati ambang warning SLA.",
    },
    {
        "project_code": "PRJ-2026-003",
        "title": "Penyediaan Bandwidth Wholesale & Transit Internet",
        "client_name": "PT Java Internet Provider",
        "contract_value": 9500000000,
        "am_email": "budi.santoso@telkom.co.id",
        "bud_email": "ahmad.yani@telkom.co.id",
        "sda_email": "arief.rahman@telkom.co.id",
        "legal_email": "indra.hermawan@telkom.co.id",
        "current_step": FunnelStepCode.PA,
        "hours_ago": 55,
        "notes": "Project Assessment (GO/NO GO) sudah overdue, perlu eskalasi ke SDA.",
    },
    {
        "project_code": "PRJ-2026-004",
        "title": "Sistem Manajemen Keamanan Siber Terintegrasi",
        "client_name": "Dinas Komunikasi & Informatika Prov Jateng",
        "contract_value": 1200000000,
        "am_email": "yuni.kartika@telkom.co.id",
        "bud_email": "dewi.lestari@telkom.co.id",
        "sda_email": "rian.wijaya@telkom.co.id",
        "legal_email": "riana.indah@telkom.co.id",
        "current_step": FunnelStepCode.SPPBJ,
        "hours_ago": 6,
        "notes": "GO dari Project Assessment, menunggu penerbitan SPPBJ/SP3MK oleh BUD.",
    },
    {
        "project_code": "PRJ-2026-005",
        "title": "Pengembangan Infrastructure Smart City & CCTV IoT",
        "client_name": "Pemerintah Kota Semarang",
        "contract_value": 3250000000,
        "am_email": "budi.santoso@telkom.co.id",
        "bud_email": "ahmad.yani@telkom.co.id",
        "sda_email": "rian.wijaya@telkom.co.id",
        "legal_email": "indra.hermawan@telkom.co.id",
        "current_step": FunnelStepCode.KL,
        "hours_ago": 52,
        "notes": "Kontrak Layanan tertahan di Legal, sudah overdue (>48 jam).",
    },
    {
        "project_code": "PRJ-2026-006",
        "title": "Implementasi IoT Smart Water Metering",
        "client_name": "PDAM Tirta Moedal Semarang",
        "contract_value": 3800000000,
        "am_email": "siti.aminah@telkom.co.id",
        "bud_email": "ahmad.yani@telkom.co.id",
        "sda_email": "rian.wijaya@telkom.co.id",
        "legal_email": "indra.hermawan@telkom.co.id",
        "current_step": None,
        "status": ProjectStatus.WON,
        "notes": "Rampung sampai BASO, proyek WIN.",
    },
    {
        "project_code": "PRJ-2026-007",
        "title": "Modernisasi Jaringan FO & SD-WAN Office Connection",
        "client_name": "PT Semen Gresik (Persero) Tbk",
        "contract_value": 7500000000,
        "am_email": "budi.santoso@telkom.co.id",
        "bud_email": "ahmad.yani@telkom.co.id",
        "sda_email": "arief.rahman@telkom.co.id",
        "legal_email": None,
        "current_step": FunnelStepCode.P9,
        "status": ProjectStatus.CANCELLED,
        "cancelled_at_step": FunnelStepCode.PA,
        "notes": "NO GO di Project Assessment - proyek dibatalkan (gerbang GO/NO GO).",
    },
]


def _seed_users(db) -> dict[str, User]:
    users: dict[str, User] = {}
    for item in SEED_USERS:
        existing = db.query(User).filter(User.email == item["email"]).first()
        if not existing:
            existing = User(**item)
            db.add(existing)
        else:
            existing.role = item["role"]
        users[item["email"]] = existing
    db.flush()
    return users


def _seed_settings(db) -> None:
    for key, value, description in [
        ("default_sla_hours", str(SLA_DEFAULT_HOURS), "Tenggat global dokumen idle di step aktif."),
        ("warning_sla_hours", str(SLA_WARNING_HOURS), "Ambang warning SLA sebelum overdue."),
    ]:
        existing = db.get(SystemSetting, key)
        if not existing:
            db.add(SystemSetting(key=key, value=value, description=description))


def _seed_project(db, spec: dict, users: dict[str, User]) -> None:
    if db.query(Project).filter(Project.project_code == spec["project_code"]).first():
        return

    am = users[spec["am_email"]]
    bud = users[spec["bud_email"]] if spec.get("bud_email") else None
    sda = users[spec["sda_email"]] if spec.get("sda_email") else None
    legal = users[spec["legal_email"]] if spec.get("legal_email") else None

    current_step: FunnelStepCode | None = spec["current_step"]
    status = spec.get("status", ProjectStatus.ACTIVE)
    effective_step = spec.get("cancelled_at_step", current_step)
    current_phase = FUNNEL_STEP_BY_CODE[effective_step].phase if effective_step and effective_step != FunnelStepCode.P9 else (
        FUNNEL_STEP_BY_CODE[FunnelStepCode.BASO].phase if status == ProjectStatus.WON else FUNNEL_STEP_BY_CODE[FunnelStepCode.P1].phase
    )

    project = Project(
        project_code=spec["project_code"],
        title=spec["title"],
        client_name=spec["client_name"],
        contract_value=spec["contract_value"],
        account_manager_id=am.id,
        bud_officer_id=bud.id if bud else None,
        sda_officer_id=sda.id if sda else None,
        legal_officer_id=legal.id if legal else None,
        current_phase=current_phase,
        current_step=current_step,
        status=status,
        sla_limit_hours=SLA_DEFAULT_HOURS,
        notes=spec.get("notes"),
    )
    db.add(project)
    db.flush()

    now = datetime.now(UTC)
    role_officer = {
        UserRole.AM: am.id,
        UserRole.BUD: bud.id if bud else None,
        UserRole.SDA: sda.id if sda else None,
        UserRole.LEGAL: legal.id if legal else None,
    }

    active_index = None
    if status == ProjectStatus.WON:
        active_index = len(FUNNEL_STEP_BY_CODE)  # semua step approved
    elif effective_step:
        active_index = list(FUNNEL_STEP_BY_CODE.keys()).index(effective_step)

    for index, code in enumerate(FUNNEL_STEP_BY_CODE.keys()):
        custodian_id = role_officer.get(primary_role_for_step(code))
        if active_index is not None and index < active_index:
            db.add(
                ProjectStep(
                    project_id=project.id,
                    step_code=code,
                    status=DocumentStatus.APPROVED,
                    custodian_id=custodian_id,
                    updated_by_label=_label_for(users, custodian_id),
                    decision=ReviewDecision.APPROVE,
                    decided_at=now - timedelta(hours=(len(FUNNEL_STEP_BY_CODE) - index) * 6),
                )
            )
        elif active_index is not None and index == active_index:
            if status == ProjectStatus.CANCELLED:
                db.add(
                    ProjectStep(
                        project_id=project.id,
                        step_code=code,
                        status=DocumentStatus.REJECTED,
                        custodian_id=custodian_id,
                        updated_by_label=_label_for(users, custodian_id),
                        decision=ReviewDecision.REJECT,
                        notes=spec.get("notes"),
                        decided_at=now,
                    )
                )
            else:
                started_at = now - timedelta(hours=spec.get("hours_ago", 0))
                db.add(
                    ProjectStep(
                        project_id=project.id,
                        step_code=code,
                        status=DocumentStatus.PENDING,
                        custodian_id=custodian_id,
                        started_at=started_at,
                        due_at=started_at + timedelta(hours=SLA_DEFAULT_HOURS),
                        first_notified_at=started_at,
                    )
                )
        else:
            db.add(ProjectStep(project_id=project.id, step_code=code, status=DocumentStatus.EMPTY))

    if status == ProjectStatus.CANCELLED:
        db.add(ProjectStep(project_id=project.id, step_code=FunnelStepCode.P9, status=DocumentStatus.REJECTED))

    db.add(
        AuditEvent(
            project_id=project.id,
            actor_id=am.id,
            event_type="create_project",
            title="Create Project",
            description=f"Inisiasi proyek {spec['title']}.",
        )
    )
    if status == ProjectStatus.WON:
        db.add(
            AuditEvent(
                project_id=project.id,
                actor_id=am.id,
                event_type="project_won",
                title="Project Won",
                description="Rampung sampai BASO, proyek berstatus selesai (WIN).",
            )
        )
    elif status == ProjectStatus.CANCELLED:
        db.add(
            AuditEvent(
                project_id=project.id,
                actor_id=(sda.id if sda else am.id),
                event_type="project_cancelled",
                title="Project Cancelled (NO GO)",
                description=spec.get("notes") or "Dibatalkan di gerbang GO/NO GO.",
            )
        )


def _label_for(users: dict[str, User], user_id: int | None) -> str | None:
    if user_id is None:
        return None
    for user in users.values():
        if user.id == user_id:
            return f"{user.display_name} ({user.role.value})"
    return None


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        users = _seed_users(db)
        _seed_settings(db)
        for spec in SEED_PROJECTS:
            _seed_project(db, spec, users)
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()
