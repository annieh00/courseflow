import React, { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type {
  ChatAction,
  ChatbotPayload,
  ChatbotResponse,
  ChatMessage,
} from "../../lib/chatbot-types"
import { useScheduler } from "./SchedulerProvider"

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080/api").replace(/\/api\/?$/, "")

async function callChatApi(
  token: string,
  academicPeriod: string,
  message: string
): Promise<ChatbotResponse> {
  const res = await fetch(
    `${BASE_URL}/api/chatbot/message?academicPeriod=${encodeURIComponent(academicPeriod)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    }
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

interface ChatbotPanelProps {
  onClose?: () => void
}

export function ChatbotPanel({ onClose }: ChatbotPanelProps) {
  const { academicPeriod, loadFromChatbotPayload } = useScheduler()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [action, setAction] = useState<ChatAction | null>(null)
  const [quickReplies, setQuickReplies] = useState<string[]>([])
  const [inputText, setInputText] = useState("")
  const [loading, setLoading] = useState(false)
  const [completedPayload, setCompletedPayload] = useState<ChatbotPayload | null>(null)
  const scrollRef = useRef<ScrollView>(null)
  const isLoadingRef = useRef(false)

  function pushBot(text: string) {
    setMessages(prev => [
      ...prev,
      { id: String(Date.now() + Math.random()), role: "bot", text },
    ])
  }

  function pushUser(text: string) {
    setMessages(prev => [
      ...prev,
      { id: String(Date.now() + Math.random()), role: "user", text },
    ])
  }

  async function send(message: string, showUserBubble = true) {
    if (isLoadingRef.current) return
    isLoadingRef.current = true
    if (showUserBubble) pushUser(message)
    setLoading(true)
    setQuickReplies([])

    try {
      const token = await AsyncStorage.getItem("accessToken")
      if (!token) {
        pushBot("Please log in to use the AI scheduler.")
        setAction("ERROR")
        setQuickReplies(["Retry"])
        return
      }

      const resp = await callChatApi(token, academicPeriod, message)
      pushBot(resp.message)
      setAction(resp.action)
      setQuickReplies(resp.quickReplies ?? [])

      if (resp.action === "COMPLETE" && resp.payload) {
        setCompletedPayload(resp.payload)
      }
    } catch {
      pushBot("Something went wrong. Please try again.")
      setAction("ERROR")
      setQuickReplies(["Try again"])
    } finally {
      isLoadingRef.current = false
      setLoading(false)
    }
  }

  // Initiate conversation on mount — no user bubble for the opening "Hi"
  useEffect(() => {
    send("Hi", false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleQuickReply(reply: string) {
    if (reply === "Reset" || reply === "Start over" || reply === "Start") {
      setMessages([])
      setAction(null)
      setQuickReplies([])
      setCompletedPayload(null)
      send("/reset", false)
      return
    }
    send(reply, true)
  }

  function handleSend() {
    const text = inputText.trim()
    if (!text) return
    setInputText("")
    send(text, true)
  }

  function handleBuildSchedule() {
    if (completedPayload) {
      loadFromChatbotPayload(completedPayload)
      onClose?.()
    }
  }

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)
  }, [messages, loading])

  const canType = action === "CONVERSATION"

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map(msg => (
          <View
            key={msg.id}
            style={[
              styles.bubble,
              msg.role === "user" ? styles.userBubble : styles.botBubble,
            ]}
          >
            <Text style={msg.role === "user" ? styles.userText : styles.botText}>
              {msg.text}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={[styles.bubble, styles.botBubble, styles.loadingBubble]}>
            <ActivityIndicator size="small" color="#64748B" />
          </View>
        )}

        {action === "COMPLETE" && completedPayload && (
          <TouchableOpacity style={styles.buildBtn} onPress={handleBuildSchedule}>
            <Text style={styles.buildBtnText}>Build My Schedule →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {/* Quick reply buttons — visible when NOT in CONVERSATION mode or as supplement */}
        {quickReplies.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickRepliesRow}
            contentContainerStyle={styles.quickRepliesContent}
          >
            {quickReplies.map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.qBtn, loading && styles.qBtnDisabled]}
                onPress={() => handleQuickReply(r)}
                disabled={loading}
              >
                <Text style={styles.qBtnText}>{r}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Free-text input only during CONVERSATION */}
        {canType && (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your preferences..."
              placeholderTextColor="#94A3B8"
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={!loading}
              multiline={false}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputText.trim() || loading) && styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || loading}
            >
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 12,
    gap: 10,
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#C8102E",
    borderBottomRightRadius: 4,
  },
  loadingBubble: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  botText: {
    color: "#1E293B",
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
  },
  buildBtn: {
    alignSelf: "center",
    backgroundColor: "#C8102E",
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 13,
    marginTop: 12,
  },
  buildBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  footer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 4 : 10,
    gap: 8,
  },
  quickRepliesRow: {
    flexShrink: 0,
  },
  quickRepliesContent: {
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  qBtn: {
    borderWidth: 1.5,
    borderColor: "#C8102E",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "#FFF",
  },
  qBtnDisabled: {
    opacity: 0.4,
  },
  qBtnText: {
    color: "#C8102E",
    fontSize: 13,
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1E293B",
  },
  sendBtn: {
    backgroundColor: "#C8102E",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
})
