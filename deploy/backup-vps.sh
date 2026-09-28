#!/usr/bin/env bash
# Respaldo de solo esta cuenta; ejecutar como root en VPS-KANTUN.
set -euo pipefail
umask 077
cuenta=cancuncerocancer
raiz=/home/$cuenta/public_html
respaldo=/root/incident-cancuncerocancer-$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p "$respaldo/config" "$respaldo/evidence"
printf '%s\n' "$respaldo" > /root/ccc-backup-path
python3 - "$raiz/wp-config.php" "$respaldo" <<'PY'
import re,sys,json,pathlib
s=pathlib.Path(sys.argv[1]).read_text()
d={k:re.search(r"define\s*\(\s*['\"]"+k+r"['\"]\s*,\s*['\"]([^'\"]+)['\"]",s).group(1) for k in ['DB_NAME','DB_USER','DB_HOST']}
assert re.fullmatch(r'[A-Za-z0-9_]+',d['DB_NAME'])
pathlib.Path(sys.argv[2]+'/db-metadata.json').write_text(json.dumps(d))
pathlib.Path(sys.argv[2]+'/db-name').write_text(d['DB_NAME'])
print('Base identificada:', d['DB_NAME'])
PY
base=$(cat "$respaldo/db-name")
# Solo lectura; no cargar PHP del sitio comprometido.
mysql -NBe "SELECT TABLE_NAME,TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA='$base'" > "$respaldo/evidence/db-tables.tsv"
mysqldump --single-transaction --routines --triggers --events --hex-blob --databases "$base" | gzip > "$respaldo/wordpress.sql.gz"
gzip -t "$respaldo/wordpress.sql.gz"
cp -a /var/cpanel/userdata/$cuenta "$respaldo/config/userdata"
cp -a /var/cpanel/users/$cuenta "$respaldo/config/cpanel-account"
cp -a /var/cpanel/databases/$cuenta.json "$respaldo/config/database-map.json"
cp -a /var/named/cancuncerocancer.com.db "$respaldo/config/dns-zone"
cp -a /home/$cuenta/.htaccess "$respaldo/config/home.htaccess"
cp -a "$raiz/.htaccess" "$respaldo/config/public.htaccess"
cp -a /home/$cuenta/.ssh "$respaldo/config/ssh"
cp -a /home/$cuenta/ssl "$respaldo/config/ssl"
(crontab -u "$cuenta" -l || true) > "$respaldo/config/account.crontab" 2>&1
(crontab -u root -l || true) > "$respaldo/config/root.crontab" 2>&1
cp -a /etc/cron.d /etc/crontab "$respaldo/config/"
find "$raiz" -xdev -printf '%m %u %g %s %T@ %C@ %p\n' > "$respaldo/evidence/files-metadata.txt"
find "$raiz" -xdev -type f ! -name error_log -print0 | sort -z | xargs -0 sha256sum > "$respaldo/evidence/source-files.sha256"
tar --acls --xattrs -czpf "$respaldo/public_html.tar.gz" -C /home/$cuenta public_html 2> "$respaldo/evidence/tar-errors.txt" || test "$?" = 1
gzip -t "$respaldo/public_html.tar.gz"
tar -tzf "$respaldo/public_html.tar.gz" > "$respaldo/evidence/archive-list.txt"
for log in /etc/apache2/logs/domlogs/cancuncerocancer.com /etc/apache2/logs/domlogs/cancuncerocancer.com-ssl_log; do
  test ! -f "$log" || cp -a "$log" "$respaldo/evidence/"
done
curl -sS -D "$respaldo/evidence/http-headers.txt" https://cancuncerocancer.com/ -o "$respaldo/evidence/home-response.html"
find "$respaldo" -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > "$respaldo/SHA256SUMS"
sha256sum -c "$respaldo/SHA256SUMS" > "$respaldo/verification.txt"
printf 'Respaldo verificado: %s\n' "$respaldo"
du -sh "$respaldo"
