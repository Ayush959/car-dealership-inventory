import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VehicleCard } from "./VehicleCard";

const car = {
  id: 1,
  make: "Porsche",
  model: "911 Carrera",
  category: "Sports",
  price: "114400.00",
  quantity: 3,
};

describe("VehicleCard", () => {
  it("shows vehicle details and purchase action", () => {
    const purchase = vi.fn();
    render(<VehicleCard vehicle={car} onPurchase={purchase} />);
    expect(screen.getByText("911 Carrera")).toBeInTheDocument();
    expect(screen.getByText("$114,400")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /purchase/i }));
    expect(purchase).toHaveBeenCalledWith(car);
  });
  it("disables purchase when sold out", () => {
    render(<VehicleCard vehicle={{ ...car, quantity: 0 }} />);
    expect(
      screen.getByRole("button", { name: /out of stock/i }),
    ).toBeDisabled();
  });
  it("hides inventory management from buyers", () => {
    render(<VehicleCard vehicle={car} />);
    expect(
      screen.queryByRole("button", { name: /edit/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /restock/i }),
    ).not.toBeInTheDocument();
  });
  it("provides inventory management for administrators", () => {
    const edit = vi.fn();
    render(
      <VehicleCard
        vehicle={car}
        admin
        onEdit={edit}
        onRestock={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(edit).toHaveBeenCalledWith(car);
    expect(
      screen.getByRole("button", { name: /restock/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });
});
