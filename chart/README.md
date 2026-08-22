# StudyBub Helm Chart

A Helm chart for deploying StudyBub to Kubernetes.

## Features

- Multi-stage Docker build with Bun
- SQLite database persistence via PersistentVolumeClaim
- Health check endpoints for Kubernetes probes
- Database migrations via init container
- Configurable resources, replicas, and environment variables
- GitHub Actions workflow for automated Docker image builds

## Prerequisites

- Kubernetes 1.24+
- Helm 3.0+
- A container image pushed to GHCR (built automatically on push to main)

## Installation

```bash
# Create a namespace.
kubectl create namespace studybub

# Install the chart with generated secrets.
helm install studybub ./chart \
  --namespace studybub \
  --set studybub.secretConfig.ENCRYPTION_KEY=$(openssl rand -hex 32) \
  --set studybub.secretConfig.SESSION_SECRET=$(openssl rand -hex 32)

# Verify the pod is running.
kubectl get pods -n studybub

# Access the app.
kubectl port-forward -n studybub svc/studybub-studybub 3000:3000
# Open http://localhost:3000
```

## Configuration

| Parameter                               | Description                                                   | Default                              |
| --------------------------------------- | ------------------------------------------------------------- | ------------------------------------ |
| `studybub.image.repository`             | Container image repository                                    | `ghcr.io/studybub/studybub`          |
| `studybub.image.tag`                    | Container image tag                                           | `latest`                             |
| `studybub.image.pullPolicy`             | Image pull policy                                             | `Always`                             |
| `studybub.replicas`                     | Number of replicas                                            | `1`                                  |
| `studybub.resources.requests.memory`    | Memory request                                                | -                                    |
| `studybub.resources.requests.cpu`       | CPU request                                                   | -                                    |
| `studybub.resources.limits.memory`      | Memory limit                                                  | -                                    |
| `studybub.resources.limits.cpu`         | CPU limit                                                     | -                                    |
| `studybub.persistence.enabled`          | Enable PVC for SQLite                                         | `true`                               |
| `studybub.persistence.size`             | PVC storage size                                              | `1Gi`                                |
| `studybub.persistence.storageClassName` | Storage class name                                            | `null` (cluster default)             |
| `studybub.config.NODE_ENV`              | Node environment                                              | `production`                         |
| `studybub.config.STUDYBUB_DB_PATH`      | SQLite database path                                          | `/data/studybub.db`                  |
| `studybub.config.STUDYBUB_PUBLIC_URL`   | Public application URL for notification click actions         | `https://studybub.syntaxrewrite.com` |
| `studybub.secretConfig.ENCRYPTION_KEY`  | 256-bit encryption key for AI configs and notification topics | -                                    |
| `studybub.secretConfig.SESSION_SECRET`  | Session secret for signed cookies                             | -                                    |
| `studybub.service.type`                 | Service type                                                  | `ClusterIP`                          |
| `studybub.service.port`                 | Service port                                                  | `3000`                               |

## Examples

### Custom resources

```yaml
studybub:
  replicas: 2
  resources:
    requests:
      memory: "256Mi"
      cpu: "200m"
    limits:
      memory: "1Gi"
      cpu: "1000m"
```

### Custom persistence

```yaml
studybub:
  persistence:
    enabled: true
    size: "10Gi"
    storageClassName: "fast-ssd"
```

### LoadBalancer service

```yaml
studybub:
  service:
    type: LoadBalancer
    port: 80
```

## Upgrading

```bash
# Upgrade after image update.
helm upgrade studybub ./chart \
  --namespace studybub \
  --set studybub.image.tag=<sha>
```

## Uninstalling

```bash
helm uninstall studybub --namespace studybub

# PVC is retained by default. Delete manually if needed.
kubectl delete pvc -n studybub -l app.kubernetes.io/name=studybub
```
