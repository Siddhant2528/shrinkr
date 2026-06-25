FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python -c "import geoip2; print('geoip2 ok')"

RUN chmod +x startup.sh

CMD ["./startup.sh"]