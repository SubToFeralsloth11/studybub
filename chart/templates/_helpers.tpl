{{/*
Common labels applied to all resources.
*/}}
{{- define "studybub.labels" -}}
app.kubernetes.io/name: studybub
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/part-of: studybub
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end }}

{{/*
Selector labels used for pod matching.
*/}}
{{- define "studybub.selectorLabels" -}}
app.kubernetes.io/name: studybub
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Fullname helper for resource naming.
*/}}
{{- define "studybub.fullname" -}}
{{ .Release.Name }}-studybub
{{- end }}
