import { describe, it, expect } from "vitest";
import { render, screen } from "../../../utils/render";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

describe("Card", () => {
  it("renders Card with all sub-components", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card body content</p>
        </CardContent>
        <CardFooter>
          <p>Footer content</p>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("Card body content")).toBeInTheDocument();
    expect(screen.getByText("Footer content")).toBeInTheDocument();
  });

  it("renders Card with custom className", () => {
    const { container } = render(
      <Card className="my-card">
        <CardContent>Content</CardContent>
      </Card>
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("my-card");
    expect(card.className).toContain("rounded-lg");
  });

  it("renders CardTitle as h3", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Heading</CardTitle>
        </CardHeader>
      </Card>
    );
    const title = screen.getByText("Heading");
    expect(title.tagName).toBe("H3");
  });

  it("renders CardDescription as p", () => {
    render(
      <Card>
        <CardHeader>
          <CardDescription>Desc</CardDescription>
        </CardHeader>
      </Card>
    );
    const desc = screen.getByText("Desc");
    expect(desc.tagName).toBe("P");
  });
});
