import { useParams } from "react-router-dom";

export default function VenueDetail() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Venue {id}</h1>
      <p className="text-gray-600 text-sm">
        (Placeholder for API fetch)
      </p>
    </div>
  );
}