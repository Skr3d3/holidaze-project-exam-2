import { useParams } from "react-router-dom";

export default function VenueEdit() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="page-heading">Edit Venue {id}</h1>
      <p className="text-gray-500 text-sm">
        (Placeholder - update venue data)
      </p>
    </div>
  );
}
