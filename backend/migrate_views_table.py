#!/usr/bin/env python3
"""
Script de migration pour créer la table views si elle n'existe pas
À exécuter si la table views n'existe pas dans la base de données
"""
import sys
from pathlib import Path

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, str(Path(__file__).parent))

from app.db.base import engine, init_db
from app.db.models import View
from sqlalchemy import inspect

def migrate():
    """Créer la table views si elle n'existe pas"""
    print("🔄 Vérification de la table 'views'...")
    
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    if 'views' in existing_tables:
        print("✅ La table 'views' existe déjà")
        return
    
    print("⚠️ La table 'views' n'existe pas, création en cours...")
    
    try:
        # Créer la table views
        View.__table__.create(engine, checkfirst=True)
        print("✅ Table 'views' créée avec succès")
    except Exception as e:
        print(f"❌ Erreur lors de la création de la table: {e}")
        raise

if __name__ == "__main__":
    migrate()

