FROM denoland/deno:debian

LABEL org.label-schema.name="dms"
LABEL org.opencontainers.image.description="MongoDB Based DMS System working with the deno-asn-generator"
LABEL org.opencontainers.image.source=https://github.com/wuespace/dms
LABEL org.opencontainers.image.licenses=MIT
LABEL maintainer="WüSpace e. V."

EXPOSE 41319

ARG PACKAGES="\
	# Fonts
	fonts-liberation \
	# PDF text extraction with pdftotext
	poppler-utils \
	# OCR with ocrmypdf
	ocrmypdf \
	tesseract-ocr-eng \
	tesseract-ocr-deu \
	# ImageMagick
	imagemagick \
	# ImageMagick with PDF support
	ghostscript \
	# zbarimg
	zbar-tools \
	"

RUN apt-get update && apt-get install --yes --quiet --no-install-recommends ${PACKAGES}

WORKDIR /app

# Install Dependencies
COPY deno.json deno.json
COPY deno.lock deno.lock

RUN deno install --frozen

# Prepare static files
COPY theme.scss theme.scss
COPY client client
COPY scripts scripts

RUN deno task compile:theme
RUN deno task compile:client


COPY . .

RUN deno install --frozen --entrypoint main.ts

ENTRYPOINT [ "/tini", "--", "docker-entrypoint.sh", "./main.ts" ]
