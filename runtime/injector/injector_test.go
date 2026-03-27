package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func writeTestManifest(t *testing.T, dir string, m *Manifest) string {
	t.Helper()
	data, err := json.Marshal(m)
	if err != nil {
		t.Fatalf("marshal manifest: %v", err)
	}
	path := filepath.Join(dir, "clientshell.manifest.json")
	if err := os.WriteFile(path, data, 0o644); err != nil {
		t.Fatalf("write manifest: %v", err)
	}
	return path
}

func TestReadManifest(t *testing.T) {
	t.Run("reads valid manifest", func(t *testing.T) {
		dir := t.TempDir()
		path := writeTestManifest(t, dir, &Manifest{
			Version:      1,
			Prefix:       "CLIENT_",
			WindowObject: "__CLIENT_CONFIG__",
			Fields: map[string]ManifestField{
				"API_URL": {Kind: "string", Required: true},
			},
		})

		m, err := ReadManifest(path)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if m.Prefix != "CLIENT_" {
			t.Errorf("expected prefix CLIENT_, got %s", m.Prefix)
		}
		if len(m.Fields) != 1 {
			t.Errorf("expected 1 field, got %d", len(m.Fields))
		}
	})

	t.Run("rejects unsupported version", func(t *testing.T) {
		dir := t.TempDir()
		path := writeTestManifest(t, dir, &Manifest{Version: 2, Fields: map[string]ManifestField{}})

		_, err := ReadManifest(path)
		if err == nil {
			t.Fatal("expected error for unsupported version")
		}
	})

	t.Run("returns error for missing file", func(t *testing.T) {
		_, err := ReadManifest("/nonexistent/path")
		if err == nil {
			t.Fatal("expected error for missing file")
		}
	})
}

func TestResolveEnv(t *testing.T) {
	tests := []struct {
		name      string
		manifest  *Manifest
		envVars   map[string]string
		wantErr   bool
		checkFunc func(t *testing.T, values map[string]interface{})
	}{
		{
			name: "resolves string env var",
			manifest: &Manifest{
				Prefix: "CLIENT_",
				Fields: map[string]ManifestField{
					"API_URL": {Kind: "string", Required: true},
				},
			},
			envVars: map[string]string{"CLIENT_API_URL": "https://api.example.com"},
			checkFunc: func(t *testing.T, values map[string]interface{}) {
				if values["API_URL"] != "https://api.example.com" {
					t.Errorf("expected https://api.example.com, got %v", values["API_URL"])
				}
			},
		},
		{
			name: "coerces boolean true",
			manifest: &Manifest{
				Prefix: "CLIENT_",
				Fields: map[string]ManifestField{
					"ENABLED": {Kind: "boolean"},
				},
			},
			envVars: map[string]string{"CLIENT_ENABLED": "true"},
			checkFunc: func(t *testing.T, values map[string]interface{}) {
				if values["ENABLED"] != true {
					t.Errorf("expected true, got %v", values["ENABLED"])
				}
			},
		},
		{
			name: "coerces number",
			manifest: &Manifest{
				Prefix: "CLIENT_",
				Fields: map[string]ManifestField{
					"INTERVAL": {Kind: "number"},
				},
			},
			envVars: map[string]string{"CLIENT_INTERVAL": "5000"},
			checkFunc: func(t *testing.T, values map[string]interface{}) {
				if values["INTERVAL"] != int64(5000) {
					t.Errorf("expected 5000, got %v", values["INTERVAL"])
				}
			},
		},
		{
			name: "parses JSON",
			manifest: &Manifest{
				Prefix: "CLIENT_",
				Fields: map[string]ManifestField{
					"FLAGS": {Kind: "json"},
				},
			},
			envVars: map[string]string{"CLIENT_FLAGS": `{"beta":true}`},
			checkFunc: func(t *testing.T, values map[string]interface{}) {
				flags, ok := values["FLAGS"].(map[string]interface{})
				if !ok {
					t.Fatalf("expected map, got %T", values["FLAGS"])
				}
				if flags["beta"] != true {
					t.Errorf("expected beta=true, got %v", flags["beta"])
				}
			},
		},
		{
			name: "applies default value",
			manifest: &Manifest{
				Prefix: "CLIENT_",
				Fields: map[string]ManifestField{
					"APP_ENV": {Kind: "string", DefaultValue: "development"},
				},
			},
			envVars: map[string]string{},
			checkFunc: func(t *testing.T, values map[string]interface{}) {
				if values["APP_ENV"] != "development" {
					t.Errorf("expected development, got %v", values["APP_ENV"])
				}
			},
		},
		{
			name: "errors on missing required field",
			manifest: &Manifest{
				Prefix: "CLIENT_",
				Fields: map[string]ManifestField{
					"API_URL": {Kind: "string", Required: true},
				},
			},
			envVars: map[string]string{},
			wantErr: true,
		},
		{
			name: "errors on invalid boolean",
			manifest: &Manifest{
				Prefix: "CLIENT_",
				Fields: map[string]ManifestField{
					"ENABLED": {Kind: "boolean"},
				},
			},
			envVars: map[string]string{"CLIENT_ENABLED": "notbool"},
			wantErr: true,
		},
		{
			name: "errors on invalid number",
			manifest: &Manifest{
				Prefix: "CLIENT_",
				Fields: map[string]ManifestField{
					"INTERVAL": {Kind: "number"},
				},
			},
			envVars: map[string]string{"CLIENT_INTERVAL": "notanumber"},
			wantErr: true,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Clear and set env vars
			os.Clearenv()
			for k, v := range tc.envVars {
				os.Setenv(k, v)
			}
			defer os.Clearenv()

			values, err := ResolveEnv(tc.manifest, false)
			if tc.wantErr {
				if err == nil {
					t.Fatal("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if tc.checkFunc != nil {
				tc.checkFunc(t, values)
			}
		})
	}
}

func TestWriteEnvConfig(t *testing.T) {
	dir := t.TempDir()
	m := &Manifest{WindowObject: "__CLIENT_CONFIG__"}
	values := map[string]interface{}{
		"API_URL":    "https://api.example.com",
		"ENABLED":    true,
		"INTERVAL":   5000,
	}

	if err := WriteEnvConfig(dir, m, values); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	data, err := os.ReadFile(filepath.Join(dir, "env-config.js"))
	if err != nil {
		t.Fatalf("read env-config.js: %v", err)
	}

	content := string(data)
	if len(content) == 0 {
		t.Fatal("env-config.js is empty")
	}

	// Check it contains the expected pattern
	if !contains(content, "window.__CLIENT_CONFIG__") {
		t.Error("expected window.__CLIENT_CONFIG__ in output")
	}
	if !contains(content, "Object.freeze") {
		t.Error("expected Object.freeze in output")
	}
	if !contains(content, "https://api.example.com") {
		t.Error("expected API URL in output")
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && searchString(s, substr)
}

func searchString(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
