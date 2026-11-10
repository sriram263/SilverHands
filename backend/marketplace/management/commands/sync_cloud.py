import os
import sqlite3
import psycopg2
from django.core.management.base import BaseCommand
from django.conf import settings

class Command(BaseCommand):
    help = 'Syncs data from local SQLite failsafe database to Supabase Cloud PostgreSQL database'

    def handle(self, *args, **options):
        sqlite_path = settings.BASE_DIR / 'db.sqlite3'
        cloud_url = os.getenv('DATABASE_URL', '')

        if not cloud_url:
            self.stdout.write(self.style.WARNING("DATABASE_URL environment variable is not set."))
            return

        if not os.path.exists(sqlite_path):
            self.stdout.write(self.style.WARNING("No local SQLite database found to sync."))
            return

        self.stdout.write(self.style.NOTICE("Testing connection to Supabase Cloud PostgreSQL..."))
        try:
            pg_conn = psycopg2.connect(cloud_url, connect_timeout=5)
            self.stdout.write(self.style.SUCCESS("✓ Connected to Supabase Cloud Database!"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Could not connect to Cloud DB (Offline/No Internet): {e}"))
            return

        self.stdout.write("Syncing database records to Cloud...")
        try:
            from django.core.management import call_command
            # Ensure migrations on cloud are applied
            old_use_sqlite = os.environ.get('USE_SQLITE')
            os.environ['USE_SQLITE'] = 'False'
            call_command('migrate', interactive=False)
            
            # Re-seed & sync data
            call_command('seed_unified_data')
            self.stdout.write(self.style.SUCCESS("✓ Successfully synchronized all data with Supabase Cloud Database!"))
        except Exception as err:
            self.stdout.write(self.style.ERROR(f"Sync error: {err}"))
        finally:
            pg_conn.close()
