import { BaseTypeValidator } from "../../BaseTypeValidator"
import AllItemsValidator from "./AllItemsValidator"
import { ContainingType, ITypeValidator } from "../../intefaces"
import { has } from "json-pointer"
import SingleItemValidator from "./SingleItemValidator"
import Context from "../../Context"

export default class ArrayValidator extends BaseTypeValidator {
  private readonly allItemsValidator: AllItemsValidator
  private readonly singleItemValidators: SingleItemValidator[] = []

  constructor (path: string = "", parent: ContainingType = null) {
    super(parent)
    this.allItemsValidator = new AllItemsValidator(this)
  }

  minItems (limit: number) {
    this.addValidator(async (value: any, obj: any, path: string, context: Context): Promise<void> => {
      if (value.length < limit) context.addError('array.minItems', path, {limit})
    })
    return this
  }

  maxItems (limit: number) {
    this.addValidator(async (value: any, obj: any, path: string, context: Context): Promise<void> => {
      if (value.length > limit) context.addError('array.maxItems', path, {limit})
    })
    return this
  }

  allItems (validator: ITypeValidator = null): AllItemsValidator {
    if (validator) this.allItemsValidator.setTypeValidator(validator)
    return this.allItemsValidator
  }

  nth (index: number): SingleItemValidator {
    const siv = new SingleItemValidator(index, this)
    this.singleItemValidators.push(siv)
    return siv
  }

  items (validators: { [key: string]: ITypeValidator }) {
    Object.keys(validators).forEach(key => {
      if (!isNaN(Number(key))) {
        const siv = new SingleItemValidator(Number(key), this)
        this.singleItemValidators.push(siv)
        siv.setValidator(validators[key])
      } else if (key === "*") {
        this.allItemsValidator.setTypeValidator(validators[key])
      }
    })
    return this
  }

  get type (): string {
    return "array"
  }

  validate (value: any, context: Context, path: string = ""): Promise<void>[] {
    let results = super.validate(value, context, path)

    if (has(value, path)) {
      // validating each entry
      results = results.concat(this.allItemsValidator.validate(value, context, path))
    }

    this.singleItemValidators.forEach(validator => {
      console.log('siv => ', value, path)
      results = results.concat(validator.validate(value, path, context))
    })

    return results
  }


}
