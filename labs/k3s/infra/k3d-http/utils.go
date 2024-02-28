package main

import (
	"bytes"
	"context"
	"fmt"
	"html/template"
	"net/http"

	k3d "github.com/k3d-io/k3d/v5/pkg/client"
	"github.com/k3d-io/k3d/v5/pkg/config"
	"github.com/k3d-io/k3d/v5/pkg/config/v1alpha5"
	"github.com/k3d-io/k3d/v5/pkg/runtimes"
	"github.com/k3d-io/k3d/v5/pkg/types"
	"github.com/spf13/viper"
)

func SetupConfig(ctx context.Context, clustername string, domain string, configTemplate template.Template) (*v1alpha5.SimpleConfig, *v1alpha5.ClusterConfig) {
	cfgViper := viper.New()
	cfgViper.SetConfigType("yaml")

	var buf bytes.Buffer
	err := configTemplate.Execute(&buf, map[string]interface{}{"username": clustername, "domain": domain})
	if err != nil {
		panic(err)
	}
	cfgViper.ReadConfig(bytes.NewReader(buf.Bytes()))
	simpleConfig, err := config.SimpleConfigFromViper(cfgViper)
	if err != nil {
		panic(err)
	}
	err = config.ProcessSimpleConfig(&simpleConfig)
	fmt.Printf("%+v\n", simpleConfig)
	if err != nil {
		panic(err)
	}
	clusterConfig, err := config.TransformSimpleToClusterConfig(ctx, runtimes.Docker, simpleConfig)
	fmt.Printf("%+v\n", clusterConfig)
	if err != nil {
		panic(err)
	}
	clusterConfig, err = config.ProcessClusterConfig(*clusterConfig)
	if err != nil {
		panic(err)
	}
	if err := config.ValidateClusterConfig(ctx, runtimes.SelectedRuntime, *clusterConfig); err != nil {
		panic(err)
	}
	return &simpleConfig, clusterConfig
}

func GetCluster(w http.ResponseWriter, r *http.Request, clusterName string) *types.Cluster {
	cluster, err := k3d.ClusterGet(r.Context(), runtimes.Docker, &types.Cluster{Name: clusterName})
	if err != nil {
		if err == k3d.ClusterGetNoNodesFoundError {
			ErrorHandler(w, r, 404, err.Error())
		} else {
			ErrorHandler(w, r, 500, err.Error())
		}
	}
	return cluster
}

func UnwrapError[T any](v T, e error) T {
	if e != nil {
		return v
	} else {
		panic(e)
	}
}

func UnwrapOk[T any](v T, ok bool, msg string) T {
	if ok {
		return v
	} else {
		panic(msg)
	}
}
