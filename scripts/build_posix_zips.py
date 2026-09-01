import os
import zipfile

def create_posix_zip(source_dir, output_zip_path):
    source_dir = os.path.abspath(source_dir)
    with zipfile.ZipFile(output_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, source_dir)
                posix_path = rel_path.replace('\\', '/')
                zipf.write(full_path, arcname=posix_path)
    
    # Inspection check
    with zipfile.ZipFile(output_zip_path, 'r') as checkf:
        names = checkf.namelist()
        print(f"Successfully packaged {output_zip_path} ({len(names)} entries):")
        for n in names[:5]:
            print(f"  - {n}")

if __name__ == "__main__":
    project_root = r"c:\Users\Aldrid\Desktop\ReputeX"
    
    ext_dir = os.path.join(project_root, "extension")
    firefox_dir = os.path.join(project_root, "extension-firefox")
    
    create_posix_zip(ext_dir, os.path.join(project_root, "ReputeX-Edge-Extension.zip"))
    create_posix_zip(ext_dir, os.path.join(project_root, "ReputeX-Chrome-Extension.zip"))
    create_posix_zip(ext_dir, os.path.join(project_root, "ReputeX-Opera-Extension.zip"))
    create_posix_zip(firefox_dir, os.path.join(project_root, "ReputeX-Firefox-Extension.zip"))
