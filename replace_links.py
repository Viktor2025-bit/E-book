import os
import re

root_dir = r'C:\My Web Sites\ebook-store\site'

# Regex to match href attributes pointing to login or register pages
# Matches:
# href="login.html"
# href="/login"
# href="../account/login.html"
# href="account/register.html"
# etc.
# But avoids #login
pattern = re.compile(r'href=["\']((?!#)[^"\']*(?:login|register)(?:\d+)?(?:\.html)?|/(?:login|register|account/login|account/register))["\']')
replacement = 'href="/api/auth/google"'

count = 0
for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith('.html'):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            new_content, n = pattern.subn(replacement, content)
            if n > 0:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {file_path}: {n} replacements")
                count += n

print(f"Total replacements: {count}")
