import { Link } from "react-router-dom";
import { OrderStatusPill } from "../../Order/OrderPills";
import { adminOrderDetailPath } from "../../../constants/frontendRoutes";
import { formatDateTime } from "../../../utils/order";
import { formatMoney } from "../../../utils/report";

// Latest orders (rows: [{ _id, orderNumber, orderStatus, total, createdAt, customer }])
const RecentOrders = ({ rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[560px] text-left text-sm text-slate-600">
      <thead className="border-b border-slate-100 bg-slate-50/80 text-[12px] font-bold uppercase tracking-wider text-slate-500">
        <tr>
          <th className="px-5 py-3">Order</th>
          <th className="px-5 py-3">Customer</th>
          <th className="px-5 py-3">Status</th>
          <th className="px-5 py-3 text-right">Total</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {rows.map((order) => (
          <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
            <td className="px-5 py-3.5">
              <Link to={adminOrderDetailPath(order._id)} className="font-bold text-slate-800 hover:text-indigo-600">
                {order.orderNumber}
              </Link>
              <p className="text-[12px] text-slate-400">{formatDateTime(order.createdAt)}</p>
            </td>
            <td className="px-5 py-3.5 font-semibold text-slate-700">{order.customer}</td>
            <td className="px-5 py-3.5">
              <OrderStatusPill status={order.orderStatus} />
            </td>
            <td className="px-5 py-3.5 text-right font-bold text-slate-800 whitespace-nowrap">{formatMoney(order.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default RecentOrders;
