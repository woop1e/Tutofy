package handler

import (
	"net/http"

	"payment-service/proto/paymentpb"
)

type PaymentHandler struct{ client paymentpb.PaymentServiceClient }

func NewPaymentHandler(c paymentpb.PaymentServiceClient) *PaymentHandler { return &PaymentHandler{c} }

func (h *PaymentHandler) CreatePayment(w http.ResponseWriter, r *http.Request) {
	var req paymentpb.CreatePaymentRequest
	if err := decode(r, &req); err != nil {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	resp, err := h.client.CreatePayment(tokenCtx(r), &req)
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusCreated, resp)
}

func (h *PaymentHandler) GetPayment(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetPayment(tokenCtx(r), &paymentpb.GetPaymentRequest{PaymentId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *PaymentHandler) GetUserPayments(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.GetUserPayments(tokenCtx(r), &paymentpb.GetUserPaymentsRequest{UserId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *PaymentHandler) CompletePayment(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.CompletePayment(tokenCtx(r), &paymentpb.UpdatePaymentStatusRequest{PaymentId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

func (h *PaymentHandler) FailPayment(w http.ResponseWriter, r *http.Request) {
	resp, err := h.client.FailPayment(tokenCtx(r), &paymentpb.UpdatePaymentStatusRequest{PaymentId: r.PathValue("id")})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}
