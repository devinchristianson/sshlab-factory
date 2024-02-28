package main

import (
	"encoding/json"
	"html/template"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"k8s.io/client-go/tools/clientcmd"

	k3d "github.com/k3d-io/k3d/v5/pkg/client"
	"github.com/k3d-io/k3d/v5/pkg/runtimes"
	"github.com/k3d-io/k3d/v5/pkg/types"
)

func main() {
	// initial setup
	templatePath, ok := os.LookupEnv("CONFIG_FILE")
	if !ok {
		templatePath, _ = filepath.Abs("config.yml")
	}
	labDomain, ok := os.LookupEnv("DOMAIN")
	if !ok {
		panic("DOMAIN is not set but it is required")
	}
	configTemplate, err := template.ParseFiles(templatePath)
	if err != nil {
		panic(err)
	}
	jwtSecret, ok := os.LookupEnv("JWT_SECRET")
	if !ok {
		panic("'JWT_SECRET' env is required!")
	}
	SetupMiddleware(jwtSecret)

	mux := http.NewServeMux()

	// handlers
	mux.Handle("/", UseWithMiddlewares(func(w http.ResponseWriter, r *http.Request) {
		ErrorHandler(w, r, 404, "Not Found")
	}))
	mux.Handle("GET /{name}/cluster/status", UseWithMiddlewares(func(w http.ResponseWriter, r *http.Request) {
		clusterName := r.PathValue("name")
		cluster := GetCluster(w, r, clusterName)
		if cluster != nil {
			data, err := json.Marshal(cluster)
			if err != nil {
				ErrorHandler(w, r, 500, err.Error())
				return
			}
			w.Header().Set("Content-Type", "application/json")
			w.Write(data)
		}
	}))

	mux.Handle("GET /{name}/cluster/delete", UseWithMiddlewares(func(w http.ResponseWriter, r *http.Request) {
		clusterName := r.PathValue("name")
		err := k3d.ClusterDelete(r.Context(), runtimes.Docker, &types.Cluster{Name: clusterName}, types.ClusterDeleteOpts{SkipRegistryCheck: true})
		if err != nil {
			ErrorHandler(w, r, 500, err.Error())
			return
		}
		SuccessHandler(w, r, "Cluster has been deleted")
	}))

	mux.Handle("GET /{name}/cluster/stop", UseWithMiddlewares(func(w http.ResponseWriter, r *http.Request) {
		clusterName := r.PathValue("name")
		cluster := GetCluster(w, r, clusterName)
		err := k3d.ClusterStop(r.Context(), runtimes.Docker, cluster)
		if err != nil {
			ErrorHandler(w, r, 500, err.Error())
			return
		}
		SuccessHandler(w, r, "Cluster has been stopped")
	}))
	mux.Handle("GET /{name}/cluster/config", UseWithMiddlewares(func(w http.ResponseWriter, r *http.Request) {
		config, err := k3d.KubeconfigGet(r.Context(), runtimes.Docker, &types.Cluster{Name: r.PathValue("name")})

		if err != nil {
			ErrorHandler(w, r, 500, err.Error())
		} else {
			data, err := clientcmd.Write(*config)
			if err != nil {
				ErrorHandler(w, r, 500, err.Error())
			} else {
				w.Header().Set("Content-Type", "application/yaml")
				w.Write(data)
			}
		}
	}))
	mux.Handle("GET /{name}/cluster/ensurerunning", UseWithMiddlewares(func(w http.ResponseWriter, r *http.Request) {
		clusterName := r.PathValue("name")
		// get existing cluster
		cluster, err := k3d.ClusterGet(r.Context(), runtimes.Docker, &types.Cluster{Name: clusterName})
		if err == nil {
			// if there's an existing cluster, if it's not running, start it
			if len(cluster.Nodes) > 0 && !cluster.Nodes[0].State.Running {
				envInfo, err := k3d.GatherEnvironmentInfo(r.Context(), runtimes.Docker, cluster)
				if err != nil {
					ErrorHandler(w, r, 500, err.Error())
					return
				}
				err = k3d.ClusterStart(r.Context(), runtimes.Docker, cluster, types.ClusterStartOpts{EnvironmentInfo: envInfo})
				if err != nil {
					ErrorHandler(w, r, 500, err.Error())
					return
				}
				SuccessHandler(w, r, "Cluster is started")
				return
			}
			// early return because cluster is running
			SuccessHandler(w, r, "Cluster is already running")
			return
		}
		simpleConf, clusterConf := SetupConfig(r.Context(), clusterName, labDomain, *configTemplate)

		if err := k3d.ClusterRun(r.Context(), runtimes.Docker, clusterConf); err != nil {
			slog.Error(err.Error())
			// rollback if we're supposed to and we've errored
			if simpleConf.Options.K3dOptions.NoRollback {
				slog.ErrorContext(r.Context(), "Cluster creation failed, not rolling back because rollback is disabled.")
			} else {
				slog.ErrorContext(r.Context(), "Failed to create cluster so attempting rollback")
				if err := k3d.ClusterDelete(r.Context(), runtimes.Docker, &clusterConf.Cluster, types.ClusterDeleteOpts{SkipRegistryCheck: true}); err != nil {
					slog.ErrorContext(r.Context(), err.Error())
					slog.ErrorContext(r.Context(), "Cluster creation failed, but rollback also failed")
				}
				slog.ErrorContext(r.Context(), "Failed cluster has deleted")
			}
			ErrorHandler(w, r, 500, "Failed to create cluster")
		}
		SuccessHandler(w, r, "Cluster has been created")
	}))
	// setup and start the server
	port, ok := os.LookupEnv("PORT")
	if !ok {
		port = "8090"
	}
	slog.Info("Starting up server!")
	slog.Error("Testing!")
	srv := http.Server{
		Handler:      mux,
		Addr:         "0.0.0.0:" + port,
		ErrorLog:     slog.NewLogLogger(slog.Default().Handler(), slog.LevelError),
		WriteTimeout: 30 * time.Second,
		ReadTimeout:  30 * time.Second,
	}
	srv.ListenAndServe()
}
