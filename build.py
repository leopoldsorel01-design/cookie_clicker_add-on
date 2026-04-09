import os

SOURCES = [
    "src/core/state.js",
    "src/core/engine.js",
    "src/ui/menu.js",
    "src/ui/tooltips.js",
    "src/bot/ascension.js",
    "src/bot/minigames.js",
    "src/main.js"
]

def build():
    os.makedirs("dist", exist_ok=True)
    out = ["/** Cookie Clicker Bot - Automated Build **/"]
    out.append("(function() { 'use strict';\n") # Wrap all modules
    
    for src in SOURCES:
        if os.path.exists(src):
            with open(src, "r", encoding="utf-8") as f:
                out.append(f"/* ========= File: {src} ========= */\n")
                out.append(f.read())
                out.append("\n")
        else:
            print(f"Warning: {src} not found!")

    out.append("\n})();\n")

    with open("dist/mod.js", "w", encoding="utf-8") as f:
        f.write("\n".join(out))
    print("Build complete: dist/mod.js")

if __name__ == "__main__":
    build()
