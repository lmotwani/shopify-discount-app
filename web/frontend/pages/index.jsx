import { useCallback, useState } from "react";
import {
  Page,
  Layout,
  Card,
  Button,
  DataTable,
  Modal,
  Toast,
  Frame,
} from "@shopify/polaris";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";
import { DiscountRuleForm } from "../components/DiscountRuleForm";
import { UninstalledAppView } from "../components/UninstalledAppView"; // Import the UninstalledAppView

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const fetch = useAuthenticatedFetch();

  const {
    data: discounts,
    refetch: refetchDiscounts,
    isLoading,
  } = useAppQuery({
    url: "/api/discounts",
  });

  const toastMarkup = toastMessage ? (
    <Toast content={toastMessage} onDismiss={() => setToastMessage(null)} />
  ) : null;

  const deleteDiscount = useCallback(async (id) => {
    if (confirm("Are you sure you want to delete this discount rule?")) {
      try {
        const response = await fetch(`/api/discounts/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          await refetchDiscounts();
          setToastMessage("Discount rule deleted successfully!");
        } else {
          const errorData = await response.json();
          setToastMessage(`Error deleting discount rule: ${errorData.error || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Error deleting discount rule:", error);
        setToastMessage("Failed to delete discount rule. Please try again later.");
      }
    }
  }, [fetch, refetchDiscounts, setToastMessage]);

  const rows = discounts?.map((discount) => [
    discount.type === "percentage" ? "Percentage" : "Fixed Amount",
    `${discount.quantity}+`,
    discount.type === "percentage" ? `${discount.value}%` : `$${discount.value}`,
    <Button destructive onClick={() => deleteDiscount(discount.id)}>
      Delete
    </Button>,
  ]) || [];

  const handleSubmit = async (data) => {
    try {
      setShowModal(false);
      await refetchDiscounts();
    } catch (error) {
      console.error("Error creating discount rule:", error);
      setToastMessage("Failed to create discount rule. Please try again later.");
    }
  };

  // Check for session or authentication
  const session = true; // Replace with actual logic to check if the app is installed

  if (!session) {
    return <UninstalledAppView />; // Render the uninstalled app view if not authenticated
  }

  return (
    <Frame>
      <Page
        title="Quantity Discounts"
        primaryAction={{
          content: "Create Discount",
          onAction: () => setShowModal(true),
        }}
      >
        <Layout>
          <Layout.Section>
            <Card>
              <DataTable
                columnContentTypes={["text", "numeric", "numeric", "text"]}
                headings={["Type", "Quantity", "Discount", "Actions"]}
                rows={rows}
                loading={isLoading}
              />
            </Card>
          </Layout.Section>

          <Modal
            open={showModal}
            onClose={() => setShowModal(false)}
            title="Create Discount Rule"
          >
            <Modal.Section>
              <DiscountRuleForm onSubmit={handleSubmit} />
            </Modal.Section>
          </Modal>
          {toastMarkup}
        </Layout>
      </Page>
    </Frame>
  );
}
