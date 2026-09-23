import { USING_MOCK_API } from '../api';

export default function DemoNotice() {
  if (!USING_MOCK_API) return null;

  return (
    <div className="demo-notice">
      <strong>Demo Mode:</strong> Data is saved in your browser. It will not be visible on other devices.
    </div>
  );
}
