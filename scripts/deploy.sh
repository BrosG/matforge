#!/usr/bin/env bash
set -euo pipefail

ENV=${1:-staging}
TAG=${2:-latest}
PROJECT="matforge-50499"
REGION="us-central1"
AR_REPO="matforge"

SUFFIX=""
[[ "$ENV" == "staging" ]] && SUFFIX="-staging"

echo "=== Deploying MatForge ($ENV) with tag: $TAG ==="

IMAGE_BASE="${REGION}-docker.pkg.dev/${PROJECT}/${AR_REPO}"

# Build and push all images
echo "Building and pushing images..."
for SERVICE in api worker frontend; do
  IMAGE="${IMAGE_BASE}/${SERVICE}:${TAG}"
  echo "  Building ${SERVICE}..."
  if [[ "$SERVICE" == "frontend" ]]; then
    docker build -f frontend/Dockerfile --target production -t "$IMAGE" frontend/
  else
    docker build -f backend/Dockerfile --target production -t "$IMAGE" .
  fi
  docker push "$IMAGE"
done

# Deploy to Cloud Run
echo ""
echo "Deploying to Cloud Run..."

echo "  Deploying API..."
gcloud run deploy "matforge-api${SUFFIX}" \
  --image "${IMAGE_BASE}/api:${TAG}" \
  --region "${REGION}" \
  --platform managed \
  --quiet

echo "  Deploying Worker..."
gcloud run deploy "matforge-worker${SUFFIX}" \
  --image "${IMAGE_BASE}/worker:${TAG}" \
  --region "${REGION}" \
  --platform managed \
  --quiet

echo "  Deploying Frontend..."
gcloud run deploy "matforge-frontend${SUFFIX}" \
  --image "${IMAGE_BASE}/frontend:${TAG}" \
  --region "${REGION}" \
  --platform managed \
  --quiet

echo ""
echo "=== Deployment complete ==="
echo "API:      $(gcloud run services describe matforge-api${SUFFIX} --region ${REGION} --format 'value(status.url)' 2>/dev/null)"
echo "Frontend: $(gcloud run services describe matforge-frontend${SUFFIX} --region ${REGION} --format 'value(status.url)' 2>/dev/null)"
