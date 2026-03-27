package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// ── Manifest types ───────────────────────────────────────

// Manifest represents the clientshell.manifest.json contract.
type Manifest struct {
	Version      int                     `json:"version"`
	Prefix       string                  `json:"prefix"`
	WindowObject string                  `json:"windowObject"`
	Fields       map[string]ManifestField `json:"fields"`
}

// ManifestField describes a single config field.
type ManifestField struct {
	Kind         string      `json:"kind"`
	Required     bool        `json:"required"`
	DefaultValue interface{} `json:"defaultValue,omitempty"`
	Description  string      `json:"description,omitempty"`
}

// ── ReadManifest ─────────────────────────────────────────

// ReadManifest reads and parses a clientshell.manifest.json file.
func ReadManifest(path string) (*Manifest, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read manifest file: %w", err)
	}

	var m Manifest
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, fmt.Errorf("parse manifest JSON: %w", err)
	}

	if m.Version != 1 {
		return nil, fmt.Errorf("unsupported manifest version: %d", m.Version)
	}

	if m.WindowObject == "" {
		m.WindowObject = "__CLIENT_CONFIG__"
	}

	return &m, nil
}

// ── ResolveEnv ───────────────────────────────────────────

// ResolveEnv reads environment variables based on the manifest and returns
// the resolved, coerced values.
func ResolveEnv(m *Manifest, debug bool) (map[string]interface{}, error) {
	values := make(map[string]interface{})

	for name, field := range m.Fields {
		envKey := m.Prefix + name
		rawValue, exists := os.LookupEnv(envKey)

		if debug {
			if exists {
				fmt.Printf("[clientshell]   %s = %q\n", envKey, rawValue)
			} else {
				fmt.Printf("[clientshell]   %s not set\n", envKey)
			}
		}

		if !exists || rawValue == "" {
			if field.Required && field.DefaultValue == nil {
				return nil, fmt.Errorf("required env var %s is not set", envKey)
			}
			if field.DefaultValue != nil {
				values[name] = field.DefaultValue
			}
			continue
		}

		coerced, err := coerceValue(envKey, rawValue, field.Kind)
		if err != nil {
			return nil, err
		}
		values[name] = coerced
	}

	return values, nil
}

// coerceValue converts a raw string env var to the appropriate Go type.
func coerceValue(key, value, kind string) (interface{}, error) {
	switch kind {
	case "string":
		return value, nil

	case "boolean":
		lower := strings.ToLower(value)
		switch lower {
		case "true", "1":
			return true, nil
		case "false", "0":
			return false, nil
		default:
			return nil, fmt.Errorf("%s: cannot coerce %q to boolean", key, value)
		}

	case "number":
		// Try int first, then float
		if i, err := strconv.ParseInt(value, 10, 64); err == nil {
			return i, nil
		}
		f, err := strconv.ParseFloat(value, 64)
		if err != nil {
			return nil, fmt.Errorf("%s: cannot coerce %q to number", key, value)
		}
		return f, nil

	case "json":
		var parsed interface{}
		if err := json.Unmarshal([]byte(value), &parsed); err != nil {
			return nil, fmt.Errorf("%s: cannot parse %q as JSON: %w", key, value, err)
		}
		return parsed, nil

	default:
		return value, nil
	}
}

// ── WriteEnvConfig ───────────────────────────────────────

// WriteEnvConfig writes the env-config.js file to the specified directory.
func WriteEnvConfig(dir string, m *Manifest, values map[string]interface{}) error {
	jsonBytes, err := json.MarshalIndent(values, "  ", "  ")
	if err != nil {
		return fmt.Errorf("marshal config values: %w", err)
	}

	content := fmt.Sprintf("window.%s = Object.freeze(\n  %s\n);\n",
		m.WindowObject, string(jsonBytes))

	outPath := filepath.Join(dir, "env-config.js")
	if err := os.WriteFile(outPath, []byte(content), 0o644); err != nil {
		return fmt.Errorf("write env-config.js: %w", err)
	}

	return nil
}
