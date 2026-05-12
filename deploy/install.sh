#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════
#  install.sh — Setup inicial de la VM Ubuntu 22.04 para SalonPro
#  Ejecutar como root: sudo bash install.sh
#
#  Lo que instala:
#    1. .NET 8 runtime
#    2. SQL Server 2022 for Linux (Developer Edition — gratis)
#    3. nginx
#    4. Certbot (Let's Encrypt) con plugin Cloudflare para wildcard
#    5. Usuarios, directorios y permisos
#    6. Systemd service + nginx config
# ══════════════════════════════════════════════════════════════════════
set -euo pipefail

DOMAIN="hubfusioncore.com.co"
SA_PASSWORD="CambiaEsto_SA_2026!"         # password del usuario SA de SQL Server
APP_DB_USER="salonpro_app"
APP_DB_PASSWORD="CambiaEsto_App_2026!"

echo "════════════════════════════════════════"
echo " SalonPro — Setup VM Ubuntu 22.04"
echo "════════════════════════════════════════"

# ── 0. Actualizaciones base ───────────────────────────────────────────
apt-get update && apt-get upgrade -y
apt-get install -y curl wget gnupg2 apt-transport-https software-properties-common \
                   rsync unzip jq ufw

# ── 1. .NET 8 Runtime ─────────────────────────────────────────────────
echo "→ Instalando .NET 8..."
wget -q https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb \
     -O /tmp/packages-microsoft-prod.deb
dpkg -i /tmp/packages-microsoft-prod.deb
apt-get update
apt-get install -y aspnetcore-runtime-8.0
dotnet --version
echo "✓ .NET 8 instalado"

# ── 2. SQL Server 2022 ────────────────────────────────────────────────
echo "→ Instalando SQL Server 2022..."
curl -fsSL https://packages.microsoft.com/keys/microsoft.asc \
  | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg
curl -s https://packages.microsoft.com/config/ubuntu/22.04/mssql-server-2022.list \
  | tee /etc/apt/sources.list.d/mssql-server-2022.list
apt-get update
apt-get install -y mssql-server

# Configurar SA password y edición Developer (gratis, sin límite de tiempo)
MSSQL_SA_PASSWORD="$SA_PASSWORD" \
MSSQL_PID="Developer" \
/opt/mssql/bin/mssql-conf -n setup accept-eula

systemctl enable mssql-server
systemctl start mssql-server
sleep 5   # esperar que SQL Server arranque

echo "✓ SQL Server 2022 instalado"

# Instalar herramientas CLI
curl -s https://packages.microsoft.com/config/ubuntu/22.04/prod.list \
  | tee /etc/apt/sources.list.d/msprod.list
apt-get update
ACCEPT_EULA=Y apt-get install -y mssql-tools18 unixodbc-dev
echo 'export PATH="$PATH:/opt/mssql-tools18/bin"' >> /etc/profile.d/mssql.sh
source /etc/profile.d/mssql.sh

# Crear base de datos y usuario de aplicación
echo "→ Creando base de datos SalonProDb..."
sqlcmd -S localhost -U SA -P "$SA_PASSWORD" -C -Q "
CREATE DATABASE SalonProDb;
GO
CREATE LOGIN $APP_DB_USER WITH PASSWORD='$APP_DB_PASSWORD';
GO
USE SalonProDb;
GO
CREATE USER $APP_DB_USER FOR LOGIN $APP_DB_USER;
GO
ALTER ROLE db_owner ADD MEMBER $APP_DB_USER;
GO
"
echo "✓ Base de datos y usuario creados"

# ── 3. nginx ──────────────────────────────────────────────────────────
echo "→ Instalando nginx..."
apt-get install -y nginx
systemctl enable nginx
echo "✓ nginx instalado"

# ── 4. Certbot + plugin Cloudflare (wildcard Let's Encrypt) ──────────
echo "→ Instalando certbot + plugin Cloudflare..."
apt-get install -y certbot python3-certbot-dns-cloudflare

# ANTES de ejecutar certbot, crea el archivo de credenciales Cloudflare:
#   sudo mkdir -p /etc/letsencrypt/cloudflare
#   sudo nano /etc/letsencrypt/cloudflare/credentials.ini
# Con el contenido:
#   dns_cloudflare_api_token = TU_TOKEN_CLOUDFLARE
#   sudo chmod 600 /etc/letsencrypt/cloudflare/credentials.ini
#
# Luego ejecuta manualmente:
#   certbot certonly \
#     --dns-cloudflare \
#     --dns-cloudflare-credentials /etc/letsencrypt/cloudflare/credentials.ini \
#     -d hubfusioncore.com.co \
#     -d "*.hubfusioncore.com.co" \
#     --agree-tos --non-interactive --email tu@email.com

echo "⚠  Certbot instalado. Ejecuta el comando de arriba manualmente"
echo "   después de configurar tus credenciales de Cloudflare."

# ── 5. Usuarios y directorios ─────────────────────────────────────────
echo "→ Creando usuario y directorios..."
useradd -r -s /bin/false salonpro || echo "Usuario salonpro ya existe"

mkdir -p /var/www/salonpro-api
mkdir -p /var/www/salon-app
mkdir -p /var/www/admin-app
mkdir -p /etc/salonpro-api
mkdir -p /var/log/salonpro

chown -R salonpro:salonpro /var/www/salonpro-api /var/log/salonpro
chown -R www-data:www-data  /var/www/salon-app /var/www/admin-app

# ── 6. Archivo de secretos (env) ──────────────────────────────────────
if [ ! -f /etc/salonpro-api/env ]; then
cat > /etc/salonpro-api/env <<EOF
ConnectionStrings__DefaultConnection=Server=localhost,1433;Database=SalonProDb;User Id=$APP_DB_USER;Password=$APP_DB_PASSWORD;TrustServerCertificate=true;
Jwt__Secret=CAMBIA_ESTO_POR_UN_STRING_ALEATORIO_DE_48_CHARS
EOF
  chmod 600 /etc/salonpro-api/env
  chown root:salonpro /etc/salonpro-api/env
  echo "✓ /etc/salonpro-api/env creado — edita Jwt__Secret antes de iniciar"
fi

# ── 7. Systemd service ────────────────────────────────────────────────
echo "→ Configurando systemd service..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "$SCRIPT_DIR/salonpro-api.service" /etc/systemd/system/salonpro-api.service
systemctl daemon-reload
systemctl enable salonpro-api
echo "✓ salonpro-api.service registrado (no iniciado aún — despliega primero)"

# ── 8. nginx config ───────────────────────────────────────────────────
echo "→ Configurando nginx..."
cp "$SCRIPT_DIR/nginx/ssl-params.conf"      /etc/nginx/ssl-params.conf
cp "$SCRIPT_DIR/nginx/hubfusioncore.conf"   /etc/nginx/sites-available/hubfusioncore
ln -sf /etc/nginx/sites-available/hubfusioncore /etc/nginx/sites-enabled/hubfusioncore
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx
echo "✓ nginx configurado"

# ── 9. Firewall ───────────────────────────────────────────────────────
echo "→ Configurando UFW..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo "✓ Firewall activo (SSH + HTTP/HTTPS abiertos)"

# ── 10. Permisos sudo para el usuario de deploy (GitHub Actions) ──────
# El usuario de GitHub Actions (ej: "deploy") necesita poder reiniciar
# el servicio sin contraseña. Agrega a /etc/sudoers.d/deploy:
# deploy ALL=(ALL) NOPASSWD: /bin/systemctl start salonpro-api, \
#                            /bin/systemctl stop salonpro-api, \
#                            /bin/rsync *
cat > /etc/sudoers.d/deploy-salonpro <<'SUDOERS'
# Permite al usuario deploy reiniciar salonpro-api y sincronizar archivos
deploy ALL=(ALL) NOPASSWD: \
    /bin/systemctl start salonpro-api, \
    /bin/systemctl stop salonpro-api, \
    /bin/systemctl status salonpro-api, \
    /bin/rsync *
SUDOERS
chmod 440 /etc/sudoers.d/deploy-salonpro
echo "✓ Permisos sudo para usuario deploy configurados"

echo ""
echo "════════════════════════════════════════"
echo " ✓ Setup completado"
echo "════════════════════════════════════════"
echo ""
echo " Pasos pendientes:"
echo "  1. Configura Cloudflare como DNS de $DOMAIN"
echo "  2. Crea token de API en Cloudflare (Zone > DNS > Edit)"
echo "  3. sudo mkdir -p /etc/letsencrypt/cloudflare"
echo "     sudo nano /etc/letsencrypt/cloudflare/credentials.ini"
echo "     → dns_cloudflare_api_token = TU_TOKEN"
echo "     sudo chmod 600 /etc/letsencrypt/cloudflare/credentials.ini"
echo "  4. sudo certbot certonly --dns-cloudflare \\"
echo "       --dns-cloudflare-credentials /etc/letsencrypt/cloudflare/credentials.ini \\"
echo "       -d $DOMAIN -d '*.$DOMAIN' \\"
echo "       --agree-tos --non-interactive --email tu@email.com"
echo "  5. Edita el JWT secret en /etc/salonpro-api/env"
echo "  6. Haz push a main para que GitHub Actions despliegue la API"
echo "  7. sudo systemctl start salonpro-api"
echo ""
