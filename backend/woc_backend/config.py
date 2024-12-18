from dynaconf import Dynaconf

settings = Dynaconf(
    envvar_prefix="WOC",
    settings_files=["settings.toml", ".secrets.toml"],
)

print(dict(settings))
