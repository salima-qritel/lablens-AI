# backend/app/db/base.py
"""
Configuration de la base de données avec SQLAlchemy + SQLModel
"""
from sqlmodel import SQLModel, Session, create_engine
from pathlib import Path

from ..core.config import settings

# Créer le répertoire de la base de données si nécessaire
settings.DUCKDB_PATH.parent.mkdir(parents=True, exist_ok=True)

# Créer le moteur SQLAlchemy pour DuckDB
# Utilise duckdb-engine qui fournit le dialecte duckdb:// pour SQLAlchemy
# Format: duckdb:///path/to/file.duckdb
engine = create_engine(
    f"duckdb:///{settings.DUCKDB_PATH}",
    echo=False,  # Mettre à True pour voir les requêtes SQL générées
    pool_pre_ping=True,  # Vérifier la connexion avant utilisation
)


def init_db():
    """
    Initialiser la base de données en créant toutes les tables
    Cette fonction doit être appelée au démarrage de l'application
    """
    # Importer tous les modèles pour que SQLModel les enregistre
    from .models import Result, File, View
    
    # Créer toutes les tables (checkfirst=True par défaut, crée seulement si n'existent pas)
    SQLModel.metadata.create_all(engine, checkfirst=True)
    
    # Vérifier explicitement que toutes les tables existent
    from sqlalchemy import inspect
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    required_tables = ['results', 'files', 'views']
    missing_tables = [t for t in required_tables if t not in existing_tables]
    
    if missing_tables:
        print(f"⚠️ Tables manquantes détectées: {missing_tables}")
        # Forcer la création des tables manquantes
        for table_name in missing_tables:
            if table_name == 'views':
                View.__table__.create(engine, checkfirst=True)
            elif table_name == 'files':
                File.__table__.create(engine, checkfirst=True)
            elif table_name == 'results':
                Result.__table__.create(engine, checkfirst=True)
        print(f"✅ Tables manquantes créées: {missing_tables}")
    
    print("✅ Tables créées avec succès")


def get_session():
    """
    Dependency pour FastAPI - retourne une session de base de données
    Usage:
        @router.get("/endpoint")
        async def my_endpoint(session: Session = Depends(get_session)):
            results = session.exec(select(Result)).all()
            ...
    """
    with Session(engine) as session:
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
