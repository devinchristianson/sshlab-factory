package main

import (
	"log/slog"
	"strings"

	"go.containerssh.io/libcontainerssh/metadata"
)

func SplitUsername(s string) (string, string) {
	r := strings.Split(s, "/")
	return r[0], r[1]
}

func ConvertValuesToBinaryValues(input map[string]metadata.Value) map[string]metadata.BinaryValue {
	output := make(map[string]metadata.BinaryValue, len(input))
	for k, v := range input {
		slog.Debug(v.Value)
		output[k] = metadata.BinaryValue{
			Value:     []byte(v.Value),
			Sensitive: v.Sensitive,
		}
	}
	return output
}
