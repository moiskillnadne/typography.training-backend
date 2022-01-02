export interface CreateBill {
    amount: {
        value: string
        currency: 'RUB'
    }
    confirmation: {
        type: "embedded"
    }
    capture: boolean
    description: string
}


export enum Cources {
    ALL_THEMES = 'ВСЕ ТЕМЫ',
    INSIDE_AND_OUTSIDE = 'ВНУТРЕННЕЕ И ВНЕШНЕЕ',
    TEXT_LAYOUT = 'ВЁРСТКА ТЕКСТА',
    ANCHOR_OBJECTS = 'ЯКОРНЫЕ ОБЪЕКТЫ',
    MODULES = 'МОДУЛИ'
}

export interface PaymentPesponse {
    id: string,
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled',
  paid: boolean,
  amount: { 
      value: string,
    currency: string
    },
  authorization_details: {
    rrn: string,
    auth_code: string,
    three_d_secure: { 
        applied: boolean 
    }
  },
  captured_at: string,
  created_at: string,
  description: string,
  income_amount: { 
      value: string,
       currency: string
    },
  metadata: {},
  payment_method: {
    type: string,
    id: string,
    saved: boolean,
    card: {
      first6: string,
      last4: string,
      expiry_month: string,
      expiry_year: string,
      card_type: string,
      issuer_country: string
    },
    title: string
  },
  recipient: { account_id: string, gateway_id: string },
  refundable: boolean,
  refunded_amount: { value: string, currency: string },
  test: boolean
}
