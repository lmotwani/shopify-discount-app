import { useCallback, useState } from "react";
import {
  Page,
  Layout,
  Card,
  Button,
  DataTable,
  Modal,
} from "@shopify/polaris";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";
import { DiscountRuleForm } from "../components/DiscountRuleForm";

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);
  const fetch = useAuthenticatedFetch();

  const {
    data: discounts,
    refetch: refetchDiscounts,
    isLoading,
  } = useAppQuery({
    url: "/api/discounts",
  });

  const deleteDiscount = useCallback(async (id) => {
    const response = await fetch(`/api/discounts/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      refetchDiscounts();
    }
  }, [fetch, refetchDiscounts]);

  const rows = discounts?.map((discount) => [
    discount.type === "percentage" ? "Percentage" : "Fixed Amount",
    `${discount.quantity}+`,
    discount.type === "percentage" ? `${discount.value}%` : `$${discount.value}`,
    <Button destructive onClick={() => deleteDiscount(discount.id)}>
      Delete
    </Button>,
  ]) || [];

  const handleSubmit = async (data) => {
    setShowModal(false);
    await refetchDiscounts();
  };

  return (
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
      </Layout>
    </Page>
  );
}
