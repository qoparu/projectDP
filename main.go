package main

import (
	"log"
	"net/http"
	"github.com/gorilla/websocket"
)

// WebSocket upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true }, // Allow all connections (adjust for production)
}

// Client connection manager
var clients = make(map[*websocket.Conn]bool) // Connected clients
var broadcast = make(chan Message)          // Broadcast channel

// Message defines the structure of messages
type Message struct {
	X      float64 `json:"x"`
	Y      float64 `json:"y"`
	Color  string  `json:"color"`
	LineW  int     `json:"lineWidth"`
	IsEraser bool  `json:"isEraser"`
}

func main() {
	// Serve the WebSocket endpoint
	http.HandleFunc("/ws", handleConnections)

	// Start listening for incoming messages
	go handleMessages()

	// Start the server
	log.Println("WebSocket server started on :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

// Handle WebSocket connections
func handleConnections(w http.ResponseWriter, r *http.Request) {
	// Upgrade the HTTP connection to a WebSocket connection
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Error upgrading connection: %v", err)
		return
	}
	defer ws.Close()

	// Register the new client
	clients[ws] = true

	for {
		var msg Message
		// Read a message from the client
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("Error reading message: %v", err)
			delete(clients, ws)
			break
		}
		// Send the message to the broadcast channel
		broadcast <- msg
	}
}

// Handle broadcasting messages to all clients
func handleMessages() {
	for {
		// Receive a message from the broadcast channel
		msg := <-broadcast

		// Send the message to all connected clients
		for client := range clients {
			err := client.WriteJSON(msg)
			if err != nil {
				log.Printf("Error writing message: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}
