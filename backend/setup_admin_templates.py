#!/usr/bin/env python3
"""
Setup Admin Templates Script
Creates all necessary template folders and files for admin load buttons
Run from your backend directory: python setup_admin_templates.py
"""

import os
import shutil
from pathlib import Path

# OLD INCORRECT PATHS (to be deleted)
OLD_TEMPLATES = [
    "templates/admin/clubs/clubmembership",
    "templates/admin/leagues/leagueparticipation",
    "templates/admin/leagues/leagueattendance",
    "templates/admin/leagues/sessionoccurrence",
]

# Template configurations
TEMPLATES = {
    "clubs/templates/admin/clubs/clubmembership": {
        "url_name": "load_club_memberships",
        "button_text": "Load Club Memberships"
    },
    "leagues/templates/admin/leagues/leagueparticipation": {
        "url_name": "load_league_participations",
        "button_text": "Load League Participations"
    },
    "leagues/templates/admin/leagues/leagueattendance": {
        "url_name": "load_league_attendance",
        "button_text": "Load League Attendance"
    },
    "leagues/templates/admin/leagues/sessionoccurrence": {
        "url_name": "load_session_occurrences",
        "button_text": "Load Session Occurrences"
    }
}

def create_change_list_html(url_name, button_text):
    """Generate change_list.html content"""
    return f'''{{%extends "admin/change_list.html" %}}

{{%block object-tools-items %}}
    {{{{ block.super }}}}
    <li>
        <a href="{{%url 'admin:{url_name}' %}}" class="button">
            {button_text}
        </a>
    </li>
{{%endblock %}}
'''

def cleanup_old_templates():
    """Delete old incorrect template directories"""
    print("🧹 Cleaning up old template directories...\n")
    
    deleted = []
    for old_path in OLD_TEMPLATES:
        path = Path(old_path)
        if path.exists():
            # Delete the entire directory tree
            shutil.rmtree(path)
            deleted.append(str(path))
            print(f"🗑️  Deleted: {path}")
    
    # Also try to delete the parent templates/admin directory if it's empty
    old_base = Path("templates/admin")
    if old_base.exists():
        # Check if clubs and leagues subdirs are empty
        clubs_dir = old_base / "clubs"
        leagues_dir = old_base / "leagues"
        
        if clubs_dir.exists() and not any(clubs_dir.iterdir()):
            clubs_dir.rmdir()
            print(f"🗑️  Deleted empty: {clubs_dir}")
        
        if leagues_dir.exists() and not any(leagues_dir.iterdir()):
            leagues_dir.rmdir()
            print(f"🗑️  Deleted empty: {leagues_dir}")
        
        # If admin dir is now empty, delete it too
        if not any(old_base.iterdir()):
            old_base.rmdir()
            print(f"🗑️  Deleted empty: {old_base}")
            
            # If templates dir is now empty, delete it too
            templates_dir = Path("templates")
            if templates_dir.exists() and not any(templates_dir.iterdir()):
                templates_dir.rmdir()
                print(f"🗑️  Deleted empty: {templates_dir}")
    
    if deleted:
        print(f"\n✅ Cleaned up {len(deleted)} old directories\n")
    else:
        print("✅ No old directories found (clean slate!)\n")

def main():
    print("🚀 Setting up Admin Template Structure...\n")
    print("="*60)
    
    # Step 1: Clean up old incorrect structure
    cleanup_old_templates()
    
    print("="*60)
    print("📁 Creating new app-specific template structure...\n")
    
    created_dirs = []
    created_files = []
    
    # Step 2: Create new correct structure
    for path, config in TEMPLATES.items():
        # Create full path
        full_path = Path(path)
        
        # Create directory
        full_path.mkdir(parents=True, exist_ok=True)
        created_dirs.append(str(full_path))
        print(f"✅ Created directory: {full_path}")
        
        # Create change_list.html
        html_file = full_path / "change_list.html"
        html_content = create_change_list_html(
            config["url_name"],
            config["button_text"]
        )
        
        html_file.write_text(html_content)
        created_files.append(str(html_file))
        print(f"✅ Created file: {html_file}")
    
    print("\n" + "="*60)
    print("🎉 SETUP COMPLETE!")
    print("="*60)
    print(f"\n📁 Created {len(created_dirs)} directories:")
    for d in created_dirs:
        print(f"   - {d}")
    
    print(f"\n📄 Created {len(created_files)} files:")
    for f in created_files:
        print(f"   - {f}")
    
    print("\n" + "="*60)
    print("📋 NEXT STEPS:")
    print("="*60)
    print("1. ✅ Copy leagues/admin.py.md code to your backend/leagues/admin.py")
    print("2. ✅ Update backend/clubs/admin.py with load button code")
    print("3. ✅ Create JSON fixtures in data/production/")
    print("4. ✅ Test locally: python manage.py loaddata data/test/test_club_memberships.json")
    print("5. ✅ Deploy to Render and click the load buttons!")
    print("\n🎊 You're all set!\n")

if __name__ == "__main__":
    main()