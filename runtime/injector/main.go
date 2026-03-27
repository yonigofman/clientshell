package main

import (
	"flag"
	"fmt"
	"log"
	"os"
)

func main() {
	manifestPath := flag.String("manifest", "", "Path to clientshell.manifest.json")
	staticDir := flag.String("dir", "", "Path to the static files directory")
	debug := flag.Bool("debug", false, "Enable debug output")
	flag.Parse()

	// Allow env var overrides
	if *manifestPath == "" {
		*manifestPath = os.Getenv("CLIENTSHELL_MANIFEST")
	}
	if *staticDir == "" {
		*staticDir = os.Getenv("CLIENTSHELL_DIR")
	}
	if !*debug && os.Getenv("CLIENTSHELL_DEBUG") == "1" {
		*debug = true
	}

	if *manifestPath == "" {
		log.Fatal("Error: --manifest flag or CLIENTSHELL_MANIFEST env var is required")
	}
	if *staticDir == "" {
		log.Fatal("Error: --dir flag or CLIENTSHELL_DIR env var is required")
	}

	manifest, err := ReadManifest(*manifestPath)
	if err != nil {
		log.Fatalf("Error reading manifest: %v", err)
	}

	if *debug {
		fmt.Printf("[clientshell] Manifest loaded: version=%d prefix=%q windowObject=%q fields=%d\n",
			manifest.Version, manifest.Prefix, manifest.WindowObject, len(manifest.Fields))
	}

	values, err := ResolveEnv(manifest, *debug)
	if err != nil {
		log.Fatalf("Error resolving env vars: %v", err)
	}

	if err := WriteEnvConfig(*staticDir, manifest, values); err != nil {
		log.Fatalf("Error writing env-config.js: %v", err)
	}

	fmt.Printf("[clientshell] env-config.js written to %s\n", *staticDir)
}
