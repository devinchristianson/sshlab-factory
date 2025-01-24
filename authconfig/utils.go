package main

import (
	"log/slog"
	"regexp"
	"strings"

	"go.containerssh.io/libcontainerssh/metadata"
)

func SplitUsername(s string) (string, string) {
	r := strings.Split(s, "/")
	if len(r) == 2 {
		return r[0], r[1]
	} else {
		return r[0], ""
	}
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

var escapeRegex = regexp.MustCompile(`[^a-zA-Z0-9\-_]+`) //0 to 9, A to Z, a to z, and the _ and -

func EscapeUsername(username string) string {
	return escapeRegex.ReplaceAllString(strings.Split(username, "@")[0], "")
}
