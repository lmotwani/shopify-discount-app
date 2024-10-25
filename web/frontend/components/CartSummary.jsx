import { useCallback, useState, useEffect } from "react";
import {
  Card,
  Layout,
  TextContainer,
  Text,
  Stack,
  Banner,
  Page,
  Button,
  Frame,
  Loading,
  Toast
} from "@shopify/polaris";
import { useTranslation } from "react-i18next";
import { useApi } from "../hooks/useApi";
import { QuantityDiscountWidget } from "./QuantityDiscountWidget";
import "./styles/CartSummary.css";

export function CartSummary() {
  const { t } = useTranslation();
  const { makeRequest } = useApi();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const data = await makeRequest("/api/cart");
        setCart(data);
      } catch (err) {
        console.error("Error fetching cart:", err);
        setToastMessage(t("cartSummary.fetchError"));
        setShowToast(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [makeRequest, t]);

  const handleUpdateQuantity = useCallback(async (lineId, quantity) => {
    try {
      setLoading(true);
      await makeRequest("/api/cart/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineId, quantity })
      });
      const updatedCart = await makeRequest("/api/cart");
      setCart(updatedCart);
      setToastMessage(t("cartSummary.updateSuccess"));
      setShowToast(true);
    } catch (err) {
      console.error("Error updating cart:", err);
      setToastMessage(t("cartSummary.updateError"));
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  }, [makeRequest, t]);

  const toastMarkup = showToast ? (
    <Toast
      content={toastMessage}
      onDismiss={() => setShowToast(false)}
      duration={3000}
    />
  ) : null;

  if (loading) {
    return (
      <Frame>
        <Loading />
      </Frame>
    );
  }

  if (!cart?.items?.length) {
    return (
      <Page title={t("cartSummary.title")}>
        <Layout>
          <Layout.Section>
            <Banner status="info">
              <p>{t("cartSummary.empty")}</p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Frame>
      {toastMarkup}
      <Page title={t("cartSummary.title")}>
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <Stack vertical spacing="loose">
                {cart.items.map((item) => (
                  <Stack key={item.id} distribution="equalSpacing" alignment="center">
                    <Stack spacing="tight">
                      <Text variant="bodyMd" as="span">
                        {item.title}
                      </Text>
                      <Text variant="bodySm" as="span" color="subdued">
                        × {item.quantity}
                      </Text>
                    </Stack>
                    <Stack spacing="tight">
                      <Button
                        plain
                        disabled={loading}
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        −
                      </Button>
                      <Text variant="bodyMd" as="span">
                        {item.quantity}
                      </Text>
                      <Button
                        plain
                        disabled={loading}
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                      <Text variant="bodyMd" as="span">
                        ${(item.price * item.quantity).toFixed(2)}
                      </Text>
                    </Stack>
                  </Stack>
                ))}

                <Stack distribution="equalSpacing">
                  <Text variant="headingSm">{t("cartSummary.subtotal")}</Text>
                  <Text variant="headingSm">${cart.subtotal.toFixed(2)}</Text>
                </Stack>

                {cart.discount > 0 && (
                  <Stack distribution="equalSpacing">
                    <Text variant="headingSm" color="success">
                      {t("cartSummary.discount")}
                    </Text>
                    <Text variant="headingSm" color="success">
                      -${cart.discount.toFixed(2)}
                    </Text>
                  </Stack>
                )}

                <Stack distribution="equalSpacing">
                  <Text variant="headingLg">{t("cartSummary.total")}</Text>
                  <Text variant="headingLg">${cart.total.toFixed(2)}</Text>
                </Stack>
              </Stack>
            </Card>
          </Layout.Section>

          <Layout.Section secondary>
            <QuantityDiscountWidget />
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}
